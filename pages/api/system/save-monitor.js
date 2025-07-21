// リアルタイム保存プロセス監視エンドポイント
const dataStore = require('../../../lib/dataStore')
const kvStore = require('../../../lib/kvStore')

// グローバルな監視状態
let saveMonitorLogs = []
const MAX_LOGS = 100

// ログ追加関数
function addSaveLog(entry) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...entry
  }
  
  saveMonitorLogs.unshift(logEntry)
  if (saveMonitorLogs.length > MAX_LOGS) {
    saveMonitorLogs = saveMonitorLogs.slice(0, MAX_LOGS)
  }
  
  console.log('SaveMonitor:', JSON.stringify(logEntry, null, 2))
}

// dataStore関数をラップして監視
const originalCreateUserAsync = dataStore.createUserAsync
const originalCreateGroupAsync = dataStore.createGroupAsync

dataStore.createUserAsync = async function(...args) {
  const startTime = Date.now()
  const operationId = `user_${startTime}`
  
  addSaveLog({
    operationId,
    type: 'user_creation_start',
    userData: args[0] ? { email: args[0].email, name: args[0].name } : null
  })
  
  try {
    const result = await originalCreateUserAsync.apply(this, args)
    
    // 保存後即座に検証
    const verificationResult = await verifySaveSuccess('users', result.id, 'user')
    
    addSaveLog({
      operationId,
      type: 'user_creation_complete',
      success: true,
      userId: result.id,
      email: result.email,
      duration: Date.now() - startTime,
      verification: verificationResult
    })
    
    return result
  } catch (error) {
    addSaveLog({
      operationId,
      type: 'user_creation_error',
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    })
    throw error
  }
}

dataStore.createGroupAsync = async function(...args) {
  const startTime = Date.now()
  const operationId = `group_${startTime}`
  
  addSaveLog({
    operationId,
    type: 'group_creation_start',
    groupData: args[0] ? { name: args[0].name, code: args[0].code } : null
  })
  
  try {
    const result = await originalCreateGroupAsync.apply(this, args)
    
    // 保存後即座に検証
    const verificationResult = await verifySaveSuccess('groups', result.id, 'group')
    
    addSaveLog({
      operationId,
      type: 'group_creation_complete',
      success: true,
      groupId: result.id,
      name: result.name,
      code: result.code,
      duration: Date.now() - startTime,
      verification: verificationResult
    })
    
    return result
  } catch (error) {
    addSaveLog({
      operationId,
      type: 'group_creation_error',
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    })
    throw error
  }
}

// 保存成功検証関数
async function verifySaveSuccess(dataType, itemId, itemType) {
  const verification = {
    memory: false,
    kv: false,
    api: false,
    details: {}
  }
  
  try {
    // メモリストレージ確認
    const memoryStorage = require('../../../lib/dataStore').memoryStorage
    if (dataType === 'users' && memoryStorage.users && memoryStorage.users.users[itemId]) {
      verification.memory = true
      verification.details.memoryData = memoryStorage.users.users[itemId]
    } else if (dataType === 'groups' && memoryStorage.groups && memoryStorage.groups.groups[itemId]) {
      verification.memory = true
      verification.details.memoryData = memoryStorage.groups.groups[itemId]
    }
    
    // KV確認
    if (kvStore.isKVAvailable()) {
      try {
        const kvData = await kvStore.getProductionData(dataType)
        if (kvData && kvData[dataType] && kvData[dataType][itemId]) {
          verification.kv = true
          verification.details.kvData = kvData[dataType][itemId]
        }
      } catch (kvError) {
        verification.details.kvError = kvError.message
      }
    }
    
    // API確認
    try {
      if (dataType === 'users') {
        const users = await dataStore.getUsersAsync()
        const foundUser = users.find(u => u.id === itemId)
        if (foundUser) {
          verification.api = true
          verification.details.apiData = foundUser
        }
      } else if (dataType === 'groups') {
        const groups = await dataStore.getGroupsAsync()
        const foundGroup = groups.find(g => g.id === itemId)
        if (foundGroup) {
          verification.api = true
          verification.details.apiData = foundGroup
        }
      }
    } catch (apiError) {
      verification.details.apiError = apiError.message
    }
    
  } catch (error) {
    verification.details.verificationError = error.message
  }
  
  return verification
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // 監視ログの取得
      const { since, type } = req.query
      let filteredLogs = saveMonitorLogs
      
      if (since) {
        const sinceTime = new Date(since).getTime()
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() >= sinceTime)
      }
      
      if (type) {
        filteredLogs = filteredLogs.filter(log => log.type.includes(type))
      }
      
      // 現在の状態も含める
      const currentState = await getCurrentDataState()
      
      return res.json({
        success: true,
        data: {
          logs: filteredLogs,
          currentState,
          summary: generateSummary(filteredLogs)
        }
      })
      
    } else if (req.method === 'POST') {
      // 手動でテストデータ作成と監視
      const { testType } = req.body
      
      if (testType === 'test_user') {
        const testUser = await dataStore.createUserAsync({
          email: `monitor_test_${Date.now()}@test.com`,
          name: `Monitor Test User ${Date.now()}`,
          role: 'USER'
        })
        
        return res.json({
          success: true,
          message: 'テストユーザーが作成されました',
          data: { user: testUser }
        })
        
      } else if (testType === 'test_group') {
        const testGroup = await dataStore.createGroupAsync({
          name: `Monitor Test Group ${Date.now()}`,
          code: `TEST_${Date.now()}`,
          description: 'Monitoring test group'
        })
        
        return res.json({
          success: true,
          message: 'テストグループが作成されました',
          data: { group: testGroup }
        })
      }
      
    } else if (req.method === 'DELETE') {
      // ログクリア
      saveMonitorLogs = []
      addSaveLog({
        type: 'monitor_reset',
        message: 'Monitoring logs cleared'
      })
      
      return res.json({
        success: true,
        message: '監視ログがクリアされました'
      })
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })

  } catch (error) {
    console.error('Save monitor error:', error)
    return res.status(500).json({
      success: false,
      message: 'Save monitor failed',
      error: error.message
    })
  }
}

async function getCurrentDataState() {
  const state = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
      kvAvailable: kvStore.isKVAvailable()
    },
    counts: {
      memory: {
        users: 0,
        groups: 0
      },
      kv: {
        users: 0,
        groups: 0
      },
      api: {
        users: 0,
        groups: 0
      }
    }
  }
  
  try {
    // メモリカウント
    const memoryStorage = require('../../../lib/dataStore').memoryStorage
    state.counts.memory.users = memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0
    state.counts.memory.groups = memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0
    
    // KVカウント
    if (kvStore.isKVAvailable()) {
      const [kvUsers, kvGroups] = await Promise.all([
        kvStore.getProductionData('users'),
        kvStore.getProductionData('groups')
      ])
      
      state.counts.kv.users = kvUsers ? Object.keys(kvUsers.users || {}).length : 0
      state.counts.kv.groups = kvGroups ? Object.keys(kvGroups.groups || {}).length : 0
    }
    
    // APIカウント
    const [apiUsers, apiGroups] = await Promise.all([
      dataStore.getUsersAsync(),
      dataStore.getGroupsAsync()
    ])
    
    state.counts.api.users = apiUsers.length
    state.counts.api.groups = apiGroups.length
    
  } catch (error) {
    state.error = error.message
  }
  
  return state
}

function generateSummary(logs) {
  const summary = {
    totalOperations: 0,
    successfulSaves: 0,
    failedSaves: 0,
    kvSaveIssues: 0,
    recentActivity: []
  }
  
  logs.forEach(log => {
    if (log.type.includes('_complete')) {
      summary.totalOperations++
      if (log.success) {
        summary.successfulSaves++
        if (log.verification && !log.verification.kv) {
          summary.kvSaveIssues++
        }
      }
    } else if (log.type.includes('_error')) {
      summary.totalOperations++
      summary.failedSaves++
    }
  })
  
  summary.recentActivity = logs.slice(0, 5).map(log => ({
    timestamp: log.timestamp,
    type: log.type,
    success: log.success
  }))
  
  return summary
}