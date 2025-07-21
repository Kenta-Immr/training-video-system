// Individual user management endpoint
const dataStore = require('../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const userId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
  if (!token.startsWith('demo-admin')) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  // データストアからユーザーを取得
  const user = dataStore.getUserById(userId)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'ユーザーが見つかりません'
    })
  }
  
  if (req.method === 'GET') {
    console.log(`ユーザー取得: ${user.name} (${user.email})`)
    
    return res.json({
      success: true,
      data: user
    })
  }
  
  if (req.method === 'PUT') {
    const { email, name, role, groupId } = req.body
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスと名前は必須です'
      })
    }
    
    // メールアドレスの重複チェック（自分以外）
    const existingUser = dataStore.getUserByEmail(email)
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      })
    }
    
    // ユーザー情報を更新
    const updatedUser = dataStore.updateUser(userId, {
      email,
      name,
      role: role ? role.toUpperCase() : user.role,
      groupId: groupId || null
    })
    
    console.log(`ユーザー更新: ${name} (${email}) - ID: ${userId}`)
    
    return res.json({
      success: true,
      data: updatedUser,
      message: 'ユーザー情報を更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    const deletedUser = dataStore.deleteUser(userId)
    
    console.log(`ユーザー削除: ${deletedUser.name} (${deletedUser.email}) - ID: ${userId}`)
    
    return res.json({
      success: true,
      data: deletedUser,
      message: 'ユーザーを削除しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}