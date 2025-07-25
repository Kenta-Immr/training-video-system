// テスト用ユーザー作成エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - POST only'
    })
  }
  
  try {
    console.log('テスト用ユーザー作成API開始')
    console.log('Request body:', req.body)
    
    const { userId, name, role = 'USER', password = 'test123' } = req.body
    
    // 基本的なバリデーション
    if (!userId || !name) {
      console.log('バリデーションエラー: userId または name が不足')
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDと名前は必須です'
      })
    }
    
    // シンプルなユーザー作成（dataStoreを使わずに直接）
    const newUser = {
      id: Date.now(), // 簡単なID生成
      userId: userId.trim(),
      name: name.trim(),
      password,
      role: role.toUpperCase(),
      groupId: null,
      isFirstLogin: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('作成されたユーザー:', newUser)
    
    return res.json({
      success: true,
      data: newUser,
      message: 'テスト用ユーザーが作成されました'
    })
    
  } catch (error) {
    console.error('テスト用ユーザー作成エラー:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    })
    
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}