// KVヘルスチェックエンドポイント
const kvStore = require('../../../../lib/kvStore')

export async function GET() {
  try {
    const startTime = Date.now()
    
    // KV可用性チェック
    const isAvailable = kvStore.isKVAvailable()
    
    if (!isAvailable) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'KVが利用できません',
        kv: {
          available: false,
          initialized: false,
          hasCredentials: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
        },
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // KV接続テスト
    const testKey = `health-check:${Date.now()}`
    const testValue = { test: true, timestamp: Date.now() }
    
    await kvStore.initializeKV()
    
    // 書き込みテスト
    const kv = await kvStore.getKVInstance()
    await kv.set(testKey, JSON.stringify(testValue), { ex: 10 })
    
    // 読み込みテスト
    const retrieved = await kv.get(testKey)
    const parsedValue = JSON.parse(retrieved)
    
    // クリーンアップ
    await kv.del(testKey)
    
    const responseTime = Date.now() - startTime
    
    return new Response(JSON.stringify({
      status: 'healthy',
      message: 'KV正常動作中',
      kv: {
        available: true,
        initialized: true,
        responseTime: `${responseTime}ms`,
        testPassed: parsedValue.test === true
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        hasCredentials: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('KVヘルスチェックエラー:', error)
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'KVヘルスチェック失敗',
      error: error.message,
      kv: {
        available: false,
        error: error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}