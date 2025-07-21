// Vercel KV (Redis) データストア
const { kv } = require('@vercel/kv')

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

// KVからデータを取得
async function getFromKV(key) {
  if (!hasKVConfig) {
    console.log('KV設定なし、nullを返却:', key)
    return null
  }
  
  try {
    const data = await kv.get(key)
    console.log(`KV取得成功: ${key}`, data ? 'データあり' : 'データなし')
    return data
  } catch (error) {
    console.error(`KV取得エラー: ${key}`, error)
    return null
  }
}

// KVにデータを保存
async function setToKV(key, data) {
  if (!hasKVConfig) {
    console.log('KV設定なし、保存スキップ:', key)
    return false
  }
  
  try {
    await kv.set(key, data)
    console.log(`KV保存成功: ${key}`)
    return true
  } catch (error) {
    console.error(`KV保存エラー: ${key}`, error)
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
  return isProduction && hasKVConfig
}

module.exports = {
  getProductionData,
  saveProductionData,
  isKVAvailable,
  KV_KEYS
}