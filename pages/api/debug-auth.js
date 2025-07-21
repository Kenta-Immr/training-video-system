// デバッグ認証API エンドポイント
// より詳細なログ出力

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
    console.log('=== DEBUG AUTH: 無効なメソッド ===')
    console.log('Method:', req.method)
    return res.status(405).json({
      success: false,
      message: 'POSTメソッドのみサポートされています'
    })
  }
  
  try {
    console.log('=== DEBUG AUTH: リクエスト受信 ===')
    console.log('Headers:', req.headers)
    console.log('Body:', req.body)
    console.log('Query:', req.query)
    
    const { email, password } = req.body
    
    console.log('=== DEBUG AUTH: データ検証 ===')
    console.log('Email:', email)
    console.log('Password:', password ? '***' : 'empty')
    
    if (!email || !password) {
      console.log('=== DEBUG AUTH: 必須フィールドエラー ===')
      return res.status(400).json({
        success: false,
        message: 'メールアドレスとパスワードは必須です',
        debug: { email: !!email, password: !!password }
      })
    }
    
    // デモ用認証ロジック
    const demoUsers = {
      'admin@test.com': {
        id: 1,
        email: 'admin@test.com',
        name: '管理者ユーザー',
        role: 'ADMIN',
        password: 'password'
      },
      'test@test.com': {
        id: 2,
        email: 'test@test.com',
        name: '一般ユーザー',
        role: 'USER',
        password: 'test'
      }
    }
    
    console.log('=== DEBUG AUTH: ユーザー検索 ===')
    console.log('Available users:', Object.keys(demoUsers))
    
    const user = demoUsers[email]
    console.log('Found user:', !!user)
    
    if (!user) {
      console.log('=== DEBUG AUTH: ユーザーが見つかりません ===')
      return res.status(401).json({
        success: false,
        message: 'ユーザーが見つかりません',
        debug: { availableEmails: Object.keys(demoUsers) }
      })
    }
    
    if (user.password !== password) {
      console.log('=== DEBUG AUTH: パスワード不一致 ===')
      console.log('Expected:', user.password)
      console.log('Received:', password)
      return res.status(401).json({
        success: false,
        message: 'パスワードが間違っています',
        debug: { email, expectedPassword: user.password }
      })
    }
    
    // より堅牢なトークン生成
    const timestamp = Date.now()
    const userInfo = `${user.id}_${user.role}_${timestamp}`
    const token = user.role === 'ADMIN' 
      ? `admin_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
      : `user_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
    
    console.log('=== DEBUG AUTH: 認証成功 ===')
    console.log('User:', user)
    console.log('Token:', token)
    console.log('Env:', process.env.NODE_ENV)
    
    return res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'デバッグログインに成功しました'
    })
    
  } catch (error) {
    console.error('=== DEBUG AUTH: サーバーエラー ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    return res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message,
      stack: error.stack
    })
  }
}