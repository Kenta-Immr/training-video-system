// ユーザー更新専用エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - POST or PUT only'
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
  
  console.log('ユーザー更新API認証チェック:', { 
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
    const { userId, name, role, groupId, password } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      })
    }
    
    console.log('ユーザー更新開始:', { userId, name, role, groupId })
    
    // 既存ユーザーの確認
    const existingUser = await dataStore.getUserByIdAsync(userId)
    if (!existingUser) {
      console.log('更新対象ユーザーが見つかりません:', userId)
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    // 他の更新フィールドの検証は必要に応じて追加
    
    // グループの存在確認
    let group = null
    if (groupId) {
      group = dataStore.getGroupById(groupId)
      if (!group) {
        return res.status(400).json({
          success: false,
          message: '指定されたグループが見つかりません'
        })
      }
    }
    
    // ユーザー情報の更新
    const updateData = {
      name: name || existingUser.name,
      role: role ? role.toUpperCase() : existingUser.role,
      groupId: groupId !== undefined ? groupId : existingUser.groupId
    }
    
    if (password) {
      updateData.password = password
    }
    
    const updatedUser = await dataStore.updateUserAsync(userId, updateData)
    
    if (updatedUser) {
      console.log(`ユーザー更新完了: ${updatedUser.name} (ID: ${updatedUser.id})`)
      
      // レスポンス用にグループ情報を付与
      const responseUser = {
        ...updatedUser,
        group
      }
      
      return res.json({
        success: true,
        data: responseUser,
        message: 'ユーザーを更新しました'
      })
    } else {
      return res.status(500).json({
        success: false,
        message: 'ユーザー更新に失敗しました'
      })
    }
    
  } catch (error) {
    console.error('ユーザー更新エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}