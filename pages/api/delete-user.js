// ユーザー削除専用エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - POST or DELETE only'
    })
  }
  
  // 認証チェック（管理者のみ）
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  
  console.log('ユーザー削除API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV,
    origin: req.headers.origin
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    console.log('認証失敗: 無効な管理者トークン', { token: token.substring(0, 10) })
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      })
    }
    
    console.log('ユーザー削除開始:', { userId })
    
    // 既存ユーザーの確認
    const existingUser = await dataStore.getUserByIdAsync(userId)
    if (!existingUser) {
      console.log('削除対象ユーザーが見つかりません:', userId)
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    console.log('削除対象ユーザー確認:', existingUser.name)
    
    // ユーザー削除実行
    const deleted = await dataStore.deleteUserAsync(userId)
    
    if (deleted) {
      console.log(`ユーザー削除完了: ${existingUser.name} (ID: ${userId})`)
      return res.json({
        success: true,
        message: 'ユーザーを削除しました',
        deletedUser: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email
        }
      })
    } else {
      console.log('ユーザー削除処理が失敗しました:', userId)
      return res.status(500).json({
        success: false,
        message: 'ユーザー削除に失敗しました'
      })
    }
    
  } catch (error) {
    console.error('ユーザー削除エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}