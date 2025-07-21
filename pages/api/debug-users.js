// ユーザーAPI専用デバッグエンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  try {
    console.log('ユーザーAPIデバッグ - リクエスト詳細:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      url: req.url
    })

    // 現在のユーザーデータを確認
    const users = await dataStore.getUsersAsync()
    
    if (req.method === 'POST') {
      // テストユーザー作成
      const testUser = await dataStore.createUserAsync({
        email: 'debug-test@example.com',
        name: 'デバッグテストユーザー',
        password: 'test123',
        role: 'USER'
      })
      
      return res.json({
        success: true,
        message: 'デバッグテスト成功',
        testUser,
        currentUserCount: users.length,
        kvStatus: {
          hasKVUrl: !!process.env.KV_REST_API_URL,
          hasKVToken: !!process.env.KV_REST_API_TOKEN
        }
      })
    }

    return res.json({
      success: true,
      currentUsers: users.map(u => ({
        id: u.id, 
        name: u.name, 
        email: u.email
      })),
      userCount: users.length,
      kvStatus: {
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN
      }
    })
    
  } catch (error) {
    console.error('ユーザーAPIデバッグエラー:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}