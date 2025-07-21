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

  const { name, email, password, role, groupId } = req.body
  
  console.log('ユーザー登録リクエスト:', { name, email, role, groupId })
  
  // バリデーション
  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: '名前、メールアドレス、パスワードは必須です'
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
  
  // ユーザー作成
  const newUser = dataStore.createUser({
    name,
    email,
    password,
    role: role || 'USER',
    groupId: groupId || null,
    isFirstLoginPending: false
  })
  
  console.log(`新規ユーザー作成: ${name} (${email}) - ID: ${newUser.id}`)
  
  return res.json({
    success: true,
    data: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      groupId: newUser.groupId
    },
    message: 'ユーザーを登録しました'
  })
}