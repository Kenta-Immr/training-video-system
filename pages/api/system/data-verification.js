// 本番データ保存状況の詳細検証エンドポイント
const dataStore = require('../../../lib/dataStore')
const kvStore = require('../../../lib/kvStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
  }

  try {
    console.log('=== 本番データ詳細検証開始 ===')
    
    const verification = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      },
      storage: {
        kv: {
          available: false,
          connected: false,
          courses: null,
          users: null,
          groups: null
        },
        memory: {
          courses: null,
          users: null,
          groups: null
        },
        api: {
          courses: null,
          users: null,
          groups: null
        }
      },
      dataConsistency: {
        issues: [],
        summary: 'unknown'
      }
    }

    // 1. KVストレージ直接確認
    console.log('1. KVストレージ直接確認')
    verification.storage.kv.available = kvStore.isKVAvailable()
    
    if (verification.storage.kv.available) {
      try {
        const connectionTest = await kvStore.testKVConnection()
        verification.storage.kv.connected = connectionTest.success
        
        if (connectionTest.success) {
          console.log('KV接続成功 - データ取得中...')
          
          // KVから直接データ取得
          const [kvCourses, kvUsers, kvGroups] = await Promise.all([
            kvStore.getProductionData('courses'),
            kvStore.getProductionData('users'),
            kvStore.getProductionData('groups')
          ])
          
          verification.storage.kv.courses = {
            exists: !!kvCourses,
            count: kvCourses ? Object.keys(kvCourses.courses || {}).length : 0,
            nextId: kvCourses?.nextCourseId || 'unknown',
            sampleIds: kvCourses ? Object.keys(kvCourses.courses || {}).slice(0, 3) : []
          }
          
          verification.storage.kv.users = {
            exists: !!kvUsers,
            count: kvUsers ? Object.keys(kvUsers.users || {}).length : 0,
            nextId: kvUsers?.nextUserId || 'unknown',
            sampleIds: kvUsers ? Object.keys(kvUsers.users || {}).slice(0, 3) : [],
            emails: kvUsers ? Object.values(kvUsers.users || {}).map(u => u.email).slice(0, 3) : []
          }
          
          verification.storage.kv.groups = {
            exists: !!kvGroups,
            count: kvGroups ? Object.keys(kvGroups.groups || {}).length : 0,
            nextId: kvGroups?.nextGroupId || 'unknown',
            sampleIds: kvGroups ? Object.keys(kvGroups.groups || {}).slice(0, 3) : [],
            codes: kvGroups ? Object.values(kvGroups.groups || {}).map(g => g.code).slice(0, 3) : []
          }
          
          console.log('KVデータ取得完了:', {
            courses: verification.storage.kv.courses.count,
            users: verification.storage.kv.users.count,
            groups: verification.storage.kv.groups.count
          })
        } else {
          console.log('KV接続失敗:', connectionTest.reason)
        }
      } catch (kvError) {
        console.error('KV確認エラー:', kvError)
        verification.storage.kv.connected = false
      }
    }

    // 2. メモリストレージ確認
    console.log('2. メモリストレージ確認')
    const memoryStorage = require('../../../lib/dataStore').memoryStorage
    
    verification.storage.memory.courses = {
      exists: !!(memoryStorage.courses && memoryStorage.courses.courses),
      count: memoryStorage.courses ? Object.keys(memoryStorage.courses.courses || {}).length : 0,
      nextId: memoryStorage.courses?.nextCourseId || 'unknown'
    }
    
    verification.storage.memory.users = {
      exists: !!(memoryStorage.users && memoryStorage.users.users),
      count: memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0,
      nextId: memoryStorage.users?.nextUserId || 'unknown'
    }
    
    verification.storage.memory.groups = {
      exists: !!(memoryStorage.groups && memoryStorage.groups.groups),
      count: memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0,
      nextId: memoryStorage.groups?.nextGroupId || 'unknown'
    }

    // 3. API経由でのデータ取得確認
    console.log('3. API経由データ確認')
    try {
      const [apiCourses, apiUsers, apiGroups] = await Promise.all([
        dataStore.getCoursesAsync(),
        dataStore.getUsersAsync(),
        dataStore.getGroupsAsync()
      ])
      
      verification.storage.api.courses = {
        count: apiCourses.length,
        sampleTitles: apiCourses.slice(0, 3).map(c => c.title),
        allValid: apiCourses.every(c => c.id && c.title && c.createdAt)
      }
      
      verification.storage.api.users = {
        count: apiUsers.length,
        sampleEmails: apiUsers.slice(0, 3).map(u => u.email),
        allValid: apiUsers.every(u => u.id && u.email && u.name),
        adminCount: apiUsers.filter(u => u.role === 'ADMIN').length,
        groupAssignments: apiUsers.filter(u => u.groupId).length
      }
      
      verification.storage.api.groups = {
        count: apiGroups.length,
        sampleCodes: apiGroups.slice(0, 3).map(g => g.code),
        allValid: apiGroups.every(g => g.id && g.name && g.code),
        codes: apiGroups.map(g => g.code)
      }
      
      console.log('API経由データ取得完了:', {
        courses: verification.storage.api.courses.count,
        users: verification.storage.api.users.count,
        groups: verification.storage.api.groups.count
      })
    } catch (apiError) {
      console.error('API経由データ取得エラー:', apiError)
      verification.dataConsistency.issues.push(`API data fetch error: ${apiError.message}`)
    }

    // 4. データ整合性分析
    console.log('4. データ整合性分析')
    const kvUsersCount = verification.storage.kv.users?.count || 0
    const memoryUsersCount = verification.storage.memory.users?.count || 0
    const apiUsersCount = verification.storage.api.users?.count || 0
    
    const kvGroupsCount = verification.storage.kv.groups?.count || 0
    const memoryGroupsCount = verification.storage.memory.groups?.count || 0
    const apiGroupsCount = verification.storage.api.groups?.count || 0

    // ユーザーデータ整合性
    if (kvUsersCount !== memoryUsersCount) {
      verification.dataConsistency.issues.push(`User count mismatch: KV(${kvUsersCount}) vs Memory(${memoryUsersCount})`)
    }
    
    if (memoryUsersCount !== apiUsersCount) {
      verification.dataConsistency.issues.push(`User count mismatch: Memory(${memoryUsersCount}) vs API(${apiUsersCount})`)
    }

    // グループデータ整合性
    if (kvGroupsCount !== memoryGroupsCount) {
      verification.dataConsistency.issues.push(`Group count mismatch: KV(${kvGroupsCount}) vs Memory(${memoryGroupsCount})`)
    }
    
    if (memoryGroupsCount !== apiGroupsCount) {
      verification.dataConsistency.issues.push(`Group count mismatch: Memory(${memoryGroupsCount}) vs API(${apiGroupsCount})`)
    }

    // KV接続問題
    if (verification.storage.kv.available && !verification.storage.kv.connected) {
      verification.dataConsistency.issues.push('KV is available but connection failed')
    }

    // データ存在確認
    if (verification.storage.kv.available && verification.storage.kv.connected) {
      if (!verification.storage.kv.users.exists) {
        verification.dataConsistency.issues.push('No user data found in KV storage')
      }
      if (!verification.storage.kv.groups.exists) {
        verification.dataConsistency.issues.push('No group data found in KV storage')
      }
    }

    // 総合判定
    if (verification.dataConsistency.issues.length === 0) {
      verification.dataConsistency.summary = 'all_consistent'
    } else if (verification.dataConsistency.issues.length <= 2) {
      verification.dataConsistency.summary = 'minor_issues'
    } else {
      verification.dataConsistency.summary = 'major_issues'
    }

    console.log('=== 本番データ詳細検証完了 ===')
    console.log('検証結果:', {
      kvConnected: verification.storage.kv.connected,
      usersInKV: verification.storage.kv.users?.count,
      groupsInKV: verification.storage.kv.groups?.count,
      issues: verification.dataConsistency.issues.length
    })

    return res.json({
      success: true,
      data: verification,
      summary: {
        kvStatus: verification.storage.kv.connected ? 'connected' : 'disconnected',
        usersStored: {
          kv: verification.storage.kv.users?.count || 0,
          memory: verification.storage.memory.users?.count || 0,
          api: verification.storage.api.users?.count || 0
        },
        groupsStored: {
          kv: verification.storage.kv.groups?.count || 0,
          memory: verification.storage.memory.groups?.count || 0,
          api: verification.storage.api.groups?.count || 0
        },
        overallStatus: verification.dataConsistency.summary,
        issueCount: verification.dataConsistency.issues.length
      }
    })

  } catch (error) {
    console.error('データ検証エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Data verification failed',
      error: error.message
    })
  }
}