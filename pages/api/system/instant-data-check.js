// 即座データ確認エンドポイント（現在のデータ保存状況の詳細確認）
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
    console.log('=== 即座データ確認開始 ===')
    
    const checkResult = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      },
      storage: {
        memory: { available: false, data: {} },
        kv: { available: false, connected: false, data: {} },
        api: { available: false, data: {} }
      },
      analysis: {
        dataExists: false,
        isConsistent: false,
        issues: [],
        recommendations: []
      }
    }

    // 1. メモリストレージ確認
    console.log('1. メモリストレージ確認中...')
    try {
      const memoryStorage = require('../../../lib/dataStore').memoryStorage
      checkResult.storage.memory.available = true
      
      checkResult.storage.memory.data = {
        users: {
          exists: !!(memoryStorage.users && memoryStorage.users.users),
          count: memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0,
          nextId: memoryStorage.users?.nextUserId || 'unknown',
          sample: memoryStorage.users && Object.keys(memoryStorage.users.users || {}).length > 0 
            ? Object.values(memoryStorage.users.users).slice(-3).map(u => ({
                id: u.id,
                email: u.email,
                name: u.name,
                createdAt: u.createdAt
              }))
            : []
        },
        groups: {
          exists: !!(memoryStorage.groups && memoryStorage.groups.groups),
          count: memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0,
          nextId: memoryStorage.groups?.nextGroupId || 'unknown',
          sample: memoryStorage.groups && Object.keys(memoryStorage.groups.groups || {}).length > 0 
            ? Object.values(memoryStorage.groups.groups).slice(-3).map(g => ({
                id: g.id,
                name: g.name,
                code: g.code,
                createdAt: g.createdAt
              }))
            : []
        }
      }
      
      console.log('メモリストレージ確認完了:', {
        users: checkResult.storage.memory.data.users.count,
        groups: checkResult.storage.memory.data.groups.count
      })
    } catch (memoryError) {
      console.error('メモリストレージ確認エラー:', memoryError)
      checkResult.storage.memory.error = memoryError.message
    }

    // 2. KVストレージ確認
    console.log('2. KVストレージ確認中...')
    checkResult.storage.kv.available = kvStore.isKVAvailable()
    
    if (checkResult.storage.kv.available) {
      try {
        // 接続テスト
        const connectionTest = await kvStore.testKVConnection()
        checkResult.storage.kv.connected = connectionTest.success
        
        if (connectionTest.success) {
          console.log('KV接続成功 - データ取得中...')
          
          const [kvUsers, kvGroups] = await Promise.all([
            kvStore.getProductionData('users'),
            kvStore.getProductionData('groups')
          ])
          
          checkResult.storage.kv.data = {
            users: {
              exists: !!(kvUsers && kvUsers.users),
              count: kvUsers ? Object.keys(kvUsers.users || {}).length : 0,
              nextId: kvUsers?.nextUserId || 'unknown',
              sample: kvUsers && Object.keys(kvUsers.users || {}).length > 0 
                ? Object.values(kvUsers.users).slice(-3).map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    createdAt: u.createdAt
                  }))
                : []
            },
            groups: {
              exists: !!(kvGroups && kvGroups.groups),
              count: kvGroups ? Object.keys(kvGroups.groups || {}).length : 0,
              nextId: kvGroups?.nextGroupId || 'unknown',
              sample: kvGroups && Object.keys(kvGroups.groups || {}).length > 0 
                ? Object.values(kvGroups.groups).slice(-3).map(g => ({
                    id: g.id,
                    name: g.name,
                    code: g.code,
                    createdAt: g.createdAt
                  }))
                : []
            }
          }
          
          console.log('KVストレージ確認完了:', {
            users: checkResult.storage.kv.data.users.count,
            groups: checkResult.storage.kv.data.groups.count
          })
        } else {
          console.log('KV接続失敗:', connectionTest.reason)
          checkResult.storage.kv.connectionError = connectionTest.reason
        }
      } catch (kvError) {
        console.error('KV確認エラー:', kvError)
        checkResult.storage.kv.error = kvError.message
        checkResult.storage.kv.connected = false
      }
    } else {
      console.log('KVストレージ利用不可')
    }

    // 3. API経由確認
    console.log('3. API経由確認中...')
    try {
      const [apiUsers, apiGroups] = await Promise.all([
        dataStore.getUsersAsync(),
        dataStore.getGroupsAsync()
      ])
      
      checkResult.storage.api.available = true
      checkResult.storage.api.data = {
        users: {
          count: apiUsers.length,
          sample: apiUsers.slice(-3).map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            createdAt: u.createdAt
          }))
        },
        groups: {
          count: apiGroups.length,
          sample: apiGroups.slice(-3).map(g => ({
            id: g.id,
            name: g.name,
            code: g.code,
            createdAt: g.createdAt
          }))
        }
      }
      
      console.log('API経由確認完了:', {
        users: checkResult.storage.api.data.users.count,
        groups: checkResult.storage.api.data.groups.count
      })
    } catch (apiError) {
      console.error('API確認エラー:', apiError)
      checkResult.storage.api.error = apiError.message
    }

    // 4. データ分析
    console.log('4. データ分析中...')
    const memUsersCount = checkResult.storage.memory.data.users?.count || 0
    const memGroupsCount = checkResult.storage.memory.data.groups?.count || 0
    const kvUsersCount = checkResult.storage.kv.data.users?.count || 0
    const kvGroupsCount = checkResult.storage.kv.data.groups?.count || 0
    const apiUsersCount = checkResult.storage.api.data.users?.count || 0
    const apiGroupsCount = checkResult.storage.api.data.groups?.count || 0

    // データ存在確認
    checkResult.analysis.dataExists = (memUsersCount > 0 || memGroupsCount > 0) || 
                                      (kvUsersCount > 0 || kvGroupsCount > 0) || 
                                      (apiUsersCount > 0 || apiGroupsCount > 0)

    // 整合性確認
    const usersConsistent = memUsersCount === kvUsersCount && memUsersCount === apiUsersCount
    const groupsConsistent = memGroupsCount === kvGroupsCount && memGroupsCount === apiGroupsCount
    checkResult.analysis.isConsistent = usersConsistent && groupsConsistent

    // 問題特定
    if (memUsersCount > kvUsersCount) {
      checkResult.analysis.issues.push(`ユーザー: メモリ(${memUsersCount}) > KV(${kvUsersCount}) - KV保存に問題あり`)
    }
    if (memGroupsCount > kvGroupsCount) {
      checkResult.analysis.issues.push(`グループ: メモリ(${memGroupsCount}) > KV(${kvGroupsCount}) - KV保存に問題あり`)
    }
    if (kvUsersCount > memUsersCount) {
      checkResult.analysis.issues.push(`ユーザー: KV(${kvUsersCount}) > メモリ(${memUsersCount}) - メモリ同期に問題あり`)
    }
    if (kvGroupsCount > memGroupsCount) {
      checkResult.analysis.issues.push(`グループ: KV(${kvGroupsCount}) > メモリ(${memGroupsCount}) - メモリ同期に問題あり`)
    }
    if (!checkResult.storage.kv.connected && checkResult.storage.kv.available) {
      checkResult.analysis.issues.push('KVは利用可能ですが接続に失敗しています')
    }
    if (memUsersCount > 0 && kvUsersCount === 0) {
      checkResult.analysis.issues.push('⚠️ 重要: ユーザーデータがメモリのみに存在 - リロード時に消失します')
    }
    if (memGroupsCount > 0 && kvGroupsCount === 0) {
      checkResult.analysis.issues.push('⚠️ 重要: グループデータがメモリのみに存在 - リロード時に消失します')
    }

    // 推奨事項
    if (checkResult.analysis.issues.length === 0) {
      checkResult.analysis.recommendations.push('データは正常に保存されています')
    } else {
      if (checkResult.analysis.issues.some(issue => issue.includes('KV保存に問題'))) {
        checkResult.analysis.recommendations.push('POST /api/system/auto-fix-data でデータをKVに同期してください')
      }
      if (checkResult.analysis.issues.some(issue => issue.includes('接続に失敗'))) {
        checkResult.analysis.recommendations.push('KV接続設定を確認してください (環境変数)')
      }
      if (checkResult.analysis.issues.some(issue => issue.includes('リロード時に消失'))) {
        checkResult.analysis.recommendations.push('緊急: 即座にデータをKVに同期する必要があります')
      }
    }

    console.log('=== 即座データ確認完了 ===')

    return res.json({
      success: true,
      data: checkResult,
      summary: {
        dataExists: checkResult.analysis.dataExists,
        isHealthy: checkResult.analysis.issues.length === 0,
        kvWorking: checkResult.storage.kv.connected,
        usersSaved: kvUsersCount > 0,
        groupsSaved: kvGroupsCount > 0,
        issueCount: checkResult.analysis.issues.length
      }
    })

  } catch (error) {
    console.error('即座データ確認エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Instant data check failed',
      error: error.message
    })
  }
}