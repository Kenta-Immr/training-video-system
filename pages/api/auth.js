// Authentication endpoint
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body
  
  console.log('Login attempt:', { email, password })
  
  // Mock authentication with multiple test users
  const testUsers = [
    { email: 'admin@test.com', password: 'password', role: 'admin', name: 'Admin User' },
    { email: 'admin@example.com', password: 'admin', role: 'admin', name: 'Admin' },
    { email: 'user@test.com', password: 'password', role: 'user', name: 'Test User' },
    { email: 'test@test.com', password: 'test', role: 'user', name: 'Test User' }
  ]
  
  const user = testUsers.find(u => u.email === email && u.password === password)
  
  if (user) {
    // トークン生成（デモ用）
    const token = user.role === 'admin' ? 'demo-admin' : 'demo-user'
    
    console.log('認証成功:', { email, role: user.role, token })
    
    res.json({
      success: true,
      token: token,
      user: {
        id: 1,
        email: user.email,
        name: user.name,
        role: user.role.toUpperCase()
      },
      message: 'ログインに成功しました'
    })
  } else {
    console.log('認証失敗:', { email, password })
    res.status(401).json({
      success: false,
      message: 'メールアドレスまたはパスワードが間違っています'
    })
  }
}