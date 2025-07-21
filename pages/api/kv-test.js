// KV接続テスト用API
import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  const timestamp = new Date().toISOString()
  
  try {
    // KV環境変数の確認
    const kvConfig = {
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN,
      hasKVUrl2: !!process.env.KV_URL,
      kvUrlPrefix: process.env.KV_REST_API_URL?.substring(0, 30) + '...',
      timestamp
    }
    
    // テストデータの書き込み
    await kv.set('test-key', { message: 'KV接続成功！', timestamp })
    
    // テストデータの読み込み
    const testData = await kv.get('test-key')
    
    // 成功レスポンス
    res.json({
      status: 'KV接続成功',
      config: kvConfig,
      testWrite: '✓ 書き込み成功',
      testRead: testData ? '✓ 読み込み成功' : '✗ 読み込み失敗',
      data: testData,
      timestamp
    })
    
  } catch (error) {
    res.json({
      status: 'KV接続エラー',
      error: error.message,
      config: {
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN,
      },
      timestamp
    })
  }
}