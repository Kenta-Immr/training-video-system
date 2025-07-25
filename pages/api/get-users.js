// Pages Router用のユーザー取得エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // CORS設定
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // 認証チェック
    const authHeader = req.headers.authorization
    
    console.log('ユーザー取得API認証チェック:', { 
      hasAuthHeader: !!authHeader,
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1'
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      })
    }
    
    const token = authHeader.substring(7)
    
    // 本番環境では簡易的な認証チェック
    if (!token || (token !== 'demo-admin' && !token.startsWith('eyJ'))) {
      return res.status(401).json({
        success: false,
        message: '有効な認証トークンが必要です'
      })
    }
    
    console.log('✓ 認証成功 - ユーザー一覧取得開始')
    
    // **強制的に最新データを取得（キャッシュ無効化）**
    const users = await dataStore.getUsersAsync()
    
    console.log(`ユーザー取得完了: ${users.length}件`)
    console.log('取得したユーザー一覧:', users.map(u => ({ 
      id: u.id, 
      userId: u.userId, 
      name: u.name,
      role: u.role,
      createdAt: u.createdAt 
    })))
    
    // キャッシュを完全に無効化
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'ユーザー取得に失敗しました',
      error: error.message
    })
  }
}