// Users management endpoint
const dataStore = require('../../lib/dataStore')

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
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
  
  if (req.method === 'GET') {
    const users = dataStore.getUsers()
    
    // グループ情報を付与
    const usersWithGroups = users.map(user => {
      let group = null
      if (user.groupId) {
        group = dataStore.getGroupById(user.groupId)
      }
      return {
        ...user,
        group
      }
    })
    
    console.log(`ユーザー一覧取得: ${users.length}件`)
    
    return res.json({
      success: true,
      data: usersWithGroups
    })
  }
  
  if (req.method === 'POST') {
    const { email, name, role = 'USER', password, groupId } = req.body
    
    console.log('ユーザー作成リクエスト:', { email, name, role, groupId })
    
    // バリデーション
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスと名前は必須です'
      })
    }
    
    // メールアドレスの重複チェック
    const existingUser = dataStore.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      })
    }
    
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
    
    const newUser = dataStore.createUser({
      email,
      name,
      role: role.toUpperCase(),
      groupId: groupId || null,
      isFirstLogin: true
    })
    
    console.log(`新規ユーザー作成: ${name} (${email}) - ID: ${newUser.id}`)
    
    // レスポンス用にグループ情報を付与
    const responseUser = {
      ...newUser,
      group,
      tempPassword: password || generateTempPassword() // デモ用
    }
    
    return res.json({
      success: true,
      data: responseUser,
      message: 'ユーザーを作成しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}