// システムヘルスチェック（本番環境診断用）
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
    console.log('=== システムヘルスチェック開始 ===')
    
    const healthCheck = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      },
      storage: {
        kvAvailable: false,
        kvConnectionTest: null,
        dataStoreStatus: null
      },
      data: {
        courses: 0,
        users: 0,
        groups: 0
      }
    }

    // KV接続テスト
    try {
      healthCheck.storage.kvAvailable = kvStore.isKVAvailable()
      if (healthCheck.storage.kvAvailable) {
        console.log('KV接続テスト実行中...')
        healthCheck.storage.kvConnectionTest = await kvStore.testKVConnection()
        console.log('KV接続テスト結果:', healthCheck.storage.kvConnectionTest)
      } else {
        console.log('KV利用不可のためテストスキップ')
        healthCheck.storage.kvConnectionTest = { success: false, reason: 'KV not available' }
      }
    } catch (kvError) {
      console.error('KV接続テストエラー:', kvError)
      healthCheck.storage.kvConnectionTest = { success: false, reason: kvError.message }
    }

    // データ件数確認
    try {
      console.log('データ件数確認中...')
      const [courses, users, groups] = await Promise.all([
        dataStore.getCoursesAsync(),
        dataStore.getUsersAsync(),
        dataStore.getGroupsAsync()
      ])
      
      healthCheck.data.courses = courses.length
      healthCheck.data.users = users.length
      healthCheck.data.groups = groups.length
      
      console.log('データ件数:', healthCheck.data)
    } catch (dataError) {
      console.error('データ件数確認エラー:', dataError)
      healthCheck.storage.dataStoreStatus = dataError.message
    }

    console.log('=== システムヘルスチェック完了 ===')
    console.log('結果:', JSON.stringify(healthCheck, null, 2))

    return res.json({
      success: true,
      data: healthCheck
    })

  } catch (error) {
    console.error('ヘルスチェック全体エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    })
  }
}