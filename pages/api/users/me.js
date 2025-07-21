// User profile endpoint
const dataStore = require('../../../lib/dataStore')

// デモユーザー用トークンマッピング（本番ではJWTを使用）
const demoTokenToUser = {
  'demo-admin': { email: 'admin@example.com' },
  'demo-user': { email: 'user@example.com' }
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      })
    }
    
    const token = authHeader.substring(7) // "Bearer " を除去
    
    // デモトークンチェック
    if (token.startsWith('demo-')) {
      const tokenUser = demoTokenToUser[token]
      if (tokenUser) {
        // データストアから実際のユーザー情報を取得
        const user = dataStore.getUserByEmail(tokenUser.email)
        if (user) {
          // グループ情報を付与
          let group = null
          if (user.groupId) {
            group = dataStore.getGroupById(user.groupId)
          }
          
          const userWithGroup = {
            ...user,
            group
          }
          
          console.log(`ユーザー情報取得: ${user.name} (${user.email})`)
          return res.json({
            success: true,
            data: userWithGroup
          })
        }
      }
    }
    
    return res.status(401).json({
      success: false,
      message: '無効なトークンです'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}