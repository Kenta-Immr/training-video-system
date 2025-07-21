// Individual user management endpoint

// 共有データストア関数
function getUsersDataFromSharedStore() {
  if (global.usersData) {
    return global.usersData
  }
  // 初期データが存在しない場合のフォールバック
  return []
}

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
  
  // 共有データを取得
  const users = getUsersDataFromSharedStore()
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'ユーザーが見つかりません'
    })
  }
  
  if (req.method === 'GET') {
    const user = users[userIndex]
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
    if (users.find(u => u.id !== userId && u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      })
    }
    
    // グループ情報取得
    const groupMapping = {
      1: { id: 1, name: '管理グループ', code: 'ADMIN001' },
      2: { id: 2, name: '開発チーム', code: 'DEV001' },
      3: { id: 3, name: '営業チーム', code: 'SALES001' }
    }
    
    // ユーザー情報を更新
    const user = users[userIndex]
    user.email = email
    user.name = name
    user.role = role ? role.toUpperCase() : user.role
    user.groupId = groupId || null
    user.group = groupId && groupMapping[groupId] ? groupMapping[groupId] : null
    user.updatedAt = new Date().toISOString()
    
    console.log(`ユーザー更新: ${name} (${email}) - ID: ${userId}`)
    
    return res.json({
      success: true,
      data: user,
      message: 'ユーザー情報を更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    const user = users[userIndex]
    users.splice(userIndex, 1)
    
    console.log(`ユーザー削除: ${user.name} (${user.email}) - ID: ${userId}`)
    
    return res.json({
      success: true,
      data: user,
      message: 'ユーザーを削除しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}