// First login pending users endpoint
const dataStore = require('../../../lib/dataStore')

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
    // データストアから初回ログイン未完了のユーザー一覧を取得
    const pendingUsers = dataStore.getFirstLoginPendingUsers()
    
    console.log(`初回ログイン未完了ユーザー取得: ${pendingUsers.length}件`)
    
    return res.json({
      success: true,
      data: pendingUsers
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}