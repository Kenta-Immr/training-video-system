// User registration endpoint
const dataStore = require('../../lib/dataStore')

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { name, userId, password, role, groupId } = req.body
  
  console.log('ユーザー登録リクエスト:', { name, userId, role, groupId })
  
  // バリデーション
  if (!name || !userId || !password) {
    return res.status(400).json({
      success: false,
      message: '名前、ユーザーID、パスワードは必須です'
    })
  }
  
  // ユーザーIDの重複チェック
  const existingUser = dataStore.getUserByUserId(userId)
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'このユーザーIDは既に使用されています'
    })
  }
  
  // ユーザー作成
  const newUser = dataStore.createUser({
    name,
    userId,
    password,
    role: role || 'USER',
    groupId: groupId || null,
    isFirstLoginPending: false
  })
  
  console.log(`新規ユーザー作成: ${name} (${userId}) - ID: ${newUser.id}`)
  
  return res.json({
    success: true,
    data: {
      id: newUser.id,
      name: newUser.name,
      userId: newUser.userId,
      role: newUser.role,
      groupId: newUser.groupId
    },
    message: 'ユーザーを登録しました'
  })
}