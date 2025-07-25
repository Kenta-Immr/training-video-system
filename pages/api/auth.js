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

  const { userId, password } = req.body
  
  console.log('Login attempt:', { userId, password })
  
  // ユーザーIDでログイン
  let user = null
  if (userId) {
    user = dataStore.getUserByUserIdAndPassword(userId, password)
    console.log('ユーザーID認証:', { userId, found: !!user })
  }
  
  if (user) {
    // より堅牢なトークン生成
    const timestamp = Date.now()
    const userInfo = `${user.id}_${user.role}_${timestamp}`
    const token = user.role === 'ADMIN' 
      ? `admin_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
      : `user_${Buffer.from(userInfo).toString('base64').substring(0, 20)}`
    
    console.log('認証成功:', { 
      userId, 
      role: user.role, 
      tokenPrefix: token.substring(0, 10),
      env: process.env.NODE_ENV
    })
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role
      },
      message: 'ログインに成功しました'
    })
  } else {
    console.log('認証失敗:', { userId, password })
    res.status(401).json({
      success: false,
      message: 'ユーザーIDまたはパスワードが間違っています'
    })
  }
}