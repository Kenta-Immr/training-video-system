// Authentication endpoint
const dataStore = require('../../lib/dataStore')

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

  const { email, userId, password } = req.body
  const loginIdentifier = userId || email // ユーザーIDまたはメールアドレス
  
  console.log('Login attempt:', { email, userId, loginIdentifier, password })
  
  // ユーザーIDまたはメールアドレスでログイン
  let user = null
  if (userId) {
    // ユーザーIDでログイン
    user = dataStore.getUserByUserIdAndPassword(userId, password)
    console.log('ユーザーID認証:', { userId, found: !!user })
  } else if (email) {
    // メールアドレスでログイン（従来の方式）
    user = dataStore.getUserByEmailAndPassword(email, password)
    console.log('メール認証:', { email, found: !!user })
  }
  
  if (user) {
    // より堅牢なトークン生成
    const timestamp = Date.now()
    const userInfo = `${user.id}_${user.role}_${timestamp}`
    const token = user.role === 'ADMIN' 
      ? `admin_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
      : `user_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
    
    console.log('認証成功:', { 
      email, 
      role: user.role, 
      tokenPrefix: token.substring(0, 10),
      env: process.env.NODE_ENV
    })
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      message: 'ログインに成功しました'
    })
  } else {
    console.log('認証失敗:', { email, userId, password })
    res.status(401).json({
      success: false,
      message: 'ユーザーIDまたはメールアドレス、パスワードが間違っています'
    })
  }
}