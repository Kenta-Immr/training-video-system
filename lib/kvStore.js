// Vercel KV (Redis) データストア
let kv = null
let kvInitialized = false

// KV初期化を確実に行う
async function initializeKV() {
  if (kvInitialized && kv) {
    return kv
  }
  
  try {
    console.log('KV初期化開始:', {
      nodeEnv: process.env.NODE_ENV,
      hasUrl: !!process.env.KV_REST_API_URL,
      hasToken: !!process.env.KV_REST_API_TOKEN
    })
    
    // KV環境変数が設定されている場合にKVを初期化
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const { kv: vercelKv } = require("@vercel/kv")
      kv = vercelKv
      
      // 実際の接続テスト
      const testKey = `test:${Date.now()}`
      await kv.set(testKey, 'connection_test', { ex: 5 }) // 5秒で期限切れ
      const testResult = await kv.get(testKey)
      
      if (testResult === 'connection_test') {
        console.log('✓ KV接続テスト成功')
        kvInitialized = true
        await kv.del(testKey) // クリーンアップ
        return kv
      } else {
        throw new Error('KV接続テスト失敗')
      }
    } else {
      console.log('KV初期化スキップ: 本番環境ではないか、環境変数が不足')
      return null
    }
  } catch (error) {
    console.error('KV初期化エラー:', error.message)
    kv = null
    kvInitialized = false
    return null
  }
}

// KV環境変数がある場合は初期化を即座に実行
if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  initializeKV().then(result => {
    if (result) {
      console.log('✓ KV初期化完了')
    } else {
      console.warn('⚠ KV初期化失敗 - フォールバックモードで動作')
    }
  }).catch(error => {
    console.error('KV初期化中の例外:', error)
  })
}

// 環境変数チェック
const isProduction = process.env.NODE_ENV === 'production'
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN

console.log('KV Store初期化:', {
  isProduction,
  hasKVConfig,
  kvUrl: process.env.KV_REST_API_URL ? 'configured' : 'not configured'
})

// KVキー定数
const KV_KEYS = {
  USERS: 'training:users',
  COURSES: 'training:courses', 
  GROUPS: 'training:groups',
  LOGS: 'training:logs',
  INSTRUCTORS: 'training:instructors'
}

// KVからデータを取得（再接続機能付き）
async function getFromKV(key) {
  // KV接続確認・再初期化
  if (!kv || !kvInitialized) {
    console.log('KV未初期化、再初期化を試行')
    kv = await initializeKV()
  }
  
  if (!hasKVConfig || !kv) {
    console.log('KV設定なし、nullを返却:', key)
    return null
  }
  
  try {
    const data = await kv.get(key)
    console.log(`✓ KV取得成功: ${key}`, data ? 'データあり' : 'データなし')
    return data
  } catch (error) {
    console.error(`✗ KV取得エラー: ${key}`, error)
    
    // 接続エラーの場合、再初期化を試行
    if (error.message.includes('connection') || error.message.includes('network')) {
      console.log('接続エラーのため再初期化を試行')
      kvInitialized = false
      kv = await initializeKV()
      
      if (kv) {
        try {
          const retryData = await kv.get(key)
          console.log(`✓ KV再試行成功: ${key}`)
          return retryData
        } catch (retryError) {
          console.error(`✗ KV再試行失敗: ${key}`, retryError)
        }
      }
    }
    
    return null
  }
}

// KVにデータを保存（再接続機能付き）
async function setToKV(key, data) {
  // KV接続確認・再初期化
  if (!kv || !kvInitialized) {
    console.log('KV未初期化、再初期化を試行')
    kv = await initializeKV()
  }
  
  if (!hasKVConfig || !kv) {
    console.log('KV設定なし、保存スキップ:', key)
    return false
  }
  
  try {
    await kv.set(key, data)
    console.log(`✓ KV保存成功: ${key}`)
    return true
  } catch (error) {
    console.error(`✗ KV保存エラー: ${key}`, error)
    
    // 接続エラーの場合、再初期化を試行
    if (error.message.includes('connection') || error.message.includes('network')) {
      console.log('保存エラーのため再初期化を試行')
      kvInitialized = false
      kv = await initializeKV()
      
      if (kv) {
        try {
          await kv.set(key, data)
          console.log(`✓ KV再試行保存成功: ${key}`)
          return true
        } catch (retryError) {
          console.error(`✗ KV再試行保存失敗: ${key}`, retryError)
        }
      }
    }
    
    return false
  }
}

// デフォルトデータ
const DEFAULT_PRODUCTION_DATA = {
  users: {
    users: {
      1: {
        id: 1,
        email: "admin@company.com",
        name: "システム管理者",
        role: "ADMIN",
        groupId: null,
        isFirstLogin: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    nextUserId: 2
  },
  courses: {
    courses: {},
    nextCourseId: 1,
    nextCurriculumId: 1,
    nextVideoId: 1
  },
  groups: {
    groups: {},
    nextGroupId: 1
  },
  logs: {
    viewingLogs: {},
    nextLogId: 1
  },
  instructors: {
    instructors: {},
    nextInstructorId: 1
  }
}

// 本番環境用データ取得
async function getProductionData(type) {
  console.log(`本番データ取得: ${type}`)
  
  const kvKey = KV_KEYS[type.toUpperCase()]
  if (!kvKey) {
    console.error('無効なデータタイプ:', type)
    return DEFAULT_PRODUCTION_DATA[type] || {}
  }
  
  // KVから取得試行
  const kvData = await getFromKV(kvKey)
  if (kvData) {
    console.log(`KVからデータ取得成功: ${type}`)
    return kvData
  }
  
  // デフォルトデータで初期化
  console.log(`デフォルトデータで初期化: ${type}`)
  const defaultData = DEFAULT_PRODUCTION_DATA[type] || {}
  
  // KVに保存
  await setToKV(kvKey, defaultData)
  
  return defaultData
}

// 本番環境用データ保存
async function saveProductionData(type, data) {
  console.log(`本番データ保存: ${type}`)
  
  const kvKey = KV_KEYS[type.toUpperCase()]
  if (!kvKey) {
    console.error('無効なデータタイプ:', type)
    return false
  }
  
  return await setToKV(kvKey, data)
}

// KV環境かどうかをチェック
function isKVAvailable() {
  const available = isProduction && hasKVConfig && kv !== null
  console.log('KV利用可能性チェック:', {
    isProduction,
    hasKVConfig,
    kvExists: !!kv,
    available
  })
  return available
}

// KVの実際の接続テスト
async function testKVConnection() {
  if (!isKVAvailable()) {
    return { success: false, reason: 'KV not available' }
  }
  
  try {
    const testKey = 'test:connection'
    const testValue = { timestamp: Date.now() }
    
    // 書き込みテスト
    const writeResult = await setToKV(testKey, testValue)
    if (!writeResult) {
      return { success: false, reason: 'Write test failed' }
    }
    
    // 読み込みテスト
    const readResult = await getFromKV(testKey)
    if (!readResult) {
      return { success: false, reason: 'Read test failed' }
    }
    
    // クリーンアップ
    try {
      await kv.del(testKey)
    } catch (cleanupError) {
      console.warn('テストキークリーンアップ失敗:', cleanupError)
    }
    
    return { success: true, data: readResult }
  } catch (error) {
    console.error('KV接続テストエラー:', error)
    return { success: false, reason: error.message }
  }
}

// KVインスタンス取得
async function getKVInstance() {
  if (!kv) {
    await initializeKV()
  }
  return kv
}

module.exports = {
  getProductionData,
  saveProductionData,
  isKVAvailable,
  testKVConnection,
  initializeKV,
  getKVInstance,
  KV_KEYS
}