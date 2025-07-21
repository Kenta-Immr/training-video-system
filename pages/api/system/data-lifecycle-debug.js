// データライフサイクルデバッグエンドポイント（作成後消失問題の調査用）
const dataStore = require('../../../lib/dataStore')
const kvStore = require('../../../lib/kvStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    console.log('=== データライフサイクルデバッグ開始 ===')
    
    const debug = {
      timestamp: new Date().toISOString(),
      method: req.method,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      },
      currentState: {},
      operations: [],
      issues: []
    }

    if (req.method === 'GET') {
      // 現在の状態を詳細に調査
      console.log('現在のデータ状態を詳細調査中...')
      
      // 1. メモリストレージの状態
      const memoryStorage = require('../../../lib/dataStore').memoryStorage
      debug.currentState.memory = {
        users: {
          exists: !!(memoryStorage.users && memoryStorage.users.users),
          count: memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0,
          nextId: memoryStorage.users?.nextUserId || 'unknown',
          lastUser: memoryStorage.users && Object.keys(memoryStorage.users.users || {}).length > 0 
            ? Object.values(memoryStorage.users.users).slice(-1)[0] 
            : null
        },
        groups: {
          exists: !!(memoryStorage.groups && memoryStorage.groups.groups),
          count: memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0,
          nextId: memoryStorage.groups?.nextGroupId || 'unknown',
          lastGroup: memoryStorage.groups && Object.keys(memoryStorage.groups.groups || {}).length > 0 
            ? Object.values(memoryStorage.groups.groups).slice(-1)[0] 
            : null
        }
      }

      // 2. KVストレージの状態
      if (kvStore.isKVAvailable()) {
        try {
          const connectionTest = await kvStore.testKVConnection()
          debug.currentState.kv = {
            connected: connectionTest.success,
            connectionDetails: connectionTest
          }
          
          if (connectionTest.success) {
            const [kvUsers, kvGroups] = await Promise.all([
              kvStore.getProductionData('users'),
              kvStore.getProductionData('groups')
            ])
            
            debug.currentState.kv.users = {
              exists: !!kvUsers,
              count: kvUsers ? Object.keys(kvUsers.users || {}).length : 0,
              nextId: kvUsers?.nextUserId || 'unknown',
              lastUser: kvUsers && Object.keys(kvUsers.users || {}).length > 0 
                ? Object.values(kvUsers.users).slice(-1)[0] 
                : null
            }
            
            debug.currentState.kv.groups = {
              exists: !!kvGroups,
              count: kvGroups ? Object.keys(kvGroups.groups || {}).length : 0,
              nextId: kvGroups?.nextGroupId || 'unknown',
              lastGroup: kvGroups && Object.keys(kvGroups.groups || {}).length > 0 
                ? Object.values(kvGroups.groups).slice(-1)[0] 
                : null
            }
          }
        } catch (kvError) {
          debug.currentState.kv = {
            connected: false,
            error: kvError.message
          }
        }
      } else {
        debug.currentState.kv = {
          connected: false,
          reason: 'KV not available'
        }
      }

      // 3. API経由での取得テスト
      try {
        const [apiUsers, apiGroups] = await Promise.all([
          dataStore.getUsersAsync(),
          dataStore.getGroupsAsync()
        ])
        
        debug.currentState.api = {
          users: {
            count: apiUsers.length,
            lastUser: apiUsers.length > 0 ? apiUsers.slice(-1)[0] : null
          },
          groups: {
            count: apiGroups.length,
            lastGroup: apiGroups.length > 0 ? apiGroups.slice(-1)[0] : null
          }
        }
      } catch (apiError) {
        debug.currentState.api = {
          error: apiError.message
        }
      }

      // 4. 整合性チェック
      const memoryUsersCount = debug.currentState.memory.users.count
      const kvUsersCount = debug.currentState.kv.users?.count || 0
      const apiUsersCount = debug.currentState.api.users?.count || 0
      
      const memoryGroupsCount = debug.currentState.memory.groups.count
      const kvGroupsCount = debug.currentState.kv.groups?.count || 0
      const apiGroupsCount = debug.currentState.api.groups?.count || 0

      if (memoryUsersCount !== kvUsersCount) {
        debug.issues.push(`Users: Memory(${memoryUsersCount}) != KV(${kvUsersCount})`)
      }
      if (memoryUsersCount !== apiUsersCount) {
        debug.issues.push(`Users: Memory(${memoryUsersCount}) != API(${apiUsersCount})`)
      }
      if (memoryGroupsCount !== kvGroupsCount) {
        debug.issues.push(`Groups: Memory(${memoryGroupsCount}) != KV(${kvGroupsCount})`)
      }
      if (memoryGroupsCount !== apiGroupsCount) {
        debug.issues.push(`Groups: Memory(${memoryGroupsCount}) != API(${apiGroupsCount})`)
      }

      // 特に問題のあるケースを特定
      if (memoryUsersCount > 0 && kvUsersCount === 0) {
        debug.issues.push('CRITICAL: Users exist in memory but not in KV - data will be lost on reload')
      }
      if (memoryGroupsCount > 0 && kvGroupsCount === 0) {
        debug.issues.push('CRITICAL: Groups exist in memory but not in KV - data will be lost on reload')
      }

    } else if (req.method === 'POST') {
      // テストデータ作成とライフサイクル追跡
      const { testType } = req.body
      
      if (testType === 'create_test_user') {
        console.log('テストユーザー作成とライフサイクル追跡中...')
        
        const testEmail = `test_${Date.now()}@debug.com`
        const testName = `Debug User ${Date.now()}`
        
        try {
          // ステップ1: 作成前の状態記録
          debug.operations.push({
            step: 1,
            action: 'before_creation',
            memoryUsers: require('../../../lib/dataStore').memoryStorage.users ? Object.keys(require('../../../lib/dataStore').memoryStorage.users.users || {}).length : 0,
            kvUsers: kvStore.isKVAvailable() ? (await kvStore.getProductionData('users'))?.users ? Object.keys((await kvStore.getProductionData('users')).users).length : 0 : 'N/A'
          })

          // ステップ2: ユーザー作成
          const newUser = await dataStore.createUserAsync({
            email: testEmail,
            name: testName,
            role: 'USER'
          })
          
          debug.operations.push({
            step: 2,
            action: 'user_created',
            userId: newUser.id,
            email: newUser.email
          })

          // ステップ3: 作成直後の状態確認
          const immediateMemoryUsers = require('../../../lib/dataStore').memoryStorage.users ? Object.keys(require('../../../lib/dataStore').memoryStorage.users.users || {}).length : 0
          const immediateKvUsers = kvStore.isKVAvailable() ? (await kvStore.getProductionData('users'))?.users ? Object.keys((await kvStore.getProductionData('users')).users).length : 0 : 'N/A'
          
          debug.operations.push({
            step: 3,
            action: 'after_creation_immediate',
            memoryUsers: immediateMemoryUsers,
            kvUsers: immediateKvUsers
          })

          // ステップ4: 5秒待機後の状態確認
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const delayedMemoryUsers = require('../../../lib/dataStore').memoryStorage.users ? Object.keys(require('../../../lib/dataStore').memoryStorage.users.users || {}).length : 0
          const delayedKvUsers = kvStore.isKVAvailable() ? (await kvStore.getProductionData('users'))?.users ? Object.keys((await kvStore.getProductionData('users')).users).length : 0 : 'N/A'
          
          debug.operations.push({
            step: 4,
            action: 'after_creation_delayed',
            memoryUsers: delayedMemoryUsers,
            kvUsers: delayedKvUsers
          })

          // ステップ5: API経由での確認
          const apiUsers = await dataStore.getUsersAsync()
          const createdUserExists = apiUsers.some(u => u.email === testEmail)
          
          debug.operations.push({
            step: 5,
            action: 'api_verification',
            userFoundViaAPI: createdUserExists,
            totalUsersViaAPI: apiUsers.length
          })

          // 問題の特定
          if (immediateMemoryUsers > immediateKvUsers && immediateKvUsers !== 'N/A') {
            debug.issues.push('ISSUE: User created in memory but not immediately synced to KV')
          }
          
          if (delayedMemoryUsers > delayedKvUsers && delayedKvUsers !== 'N/A') {
            debug.issues.push('CRITICAL: User still not synced to KV after 5 seconds')
          }
          
          if (!createdUserExists) {
            debug.issues.push('CRITICAL: User not found via API after creation')
          }

        } catch (createError) {
          debug.operations.push({
            step: 'error',
            action: 'creation_failed',
            error: createError.message
          })
          debug.issues.push(`User creation failed: ${createError.message}`)
        }
      }
    }

    console.log('=== データライフサイクルデバッグ完了 ===')

    return res.json({
      success: true,
      data: debug,
      diagnosis: {
        hasMemoryKvMismatch: debug.issues.some(issue => issue.includes('!=')),
        hasCriticalIssues: debug.issues.some(issue => issue.includes('CRITICAL')),
        likelyDataLossOnReload: debug.issues.some(issue => issue.includes('data will be lost on reload')),
        issueCount: debug.issues.length
      }
    })

  } catch (error) {
    console.error('データライフサイクルデバッグエラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Data lifecycle debug failed',
      error: error.message
    })
  }
}