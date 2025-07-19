// User profile endpoint

// デモユーザーデータ
const demoUsers = {
  'demo-admin': {
    id: 1,
    email: 'admin@test.com',
    name: '管理者ユーザー',
    role: 'ADMIN',
    groupId: 1,
    group: {
      id: 1,
      name: '管理グループ',
      code: 'ADMIN001',
      description: '管理者グループ'
    },
    isFirstLogin: false,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  'demo-user': {
    id: 2,
    email: 'user@test.com',
    name: '一般ユーザー',
    role: 'USER',
    groupId: 2,
    group: {
      id: 2,
      name: '一般グループ',
      code: 'USER001',
      description: '一般ユーザーグループ'
    },
    isFirstLogin: true,
    lastLoginAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
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
      const user = demoUsers[token]
      if (user) {
        console.log(`ユーザー情報取得: ${user.name} (${user.email})`)
        return res.json({
          success: true,
          data: user
        })
      }
    }
    
    return res.status(401).json({
      success: false,
      message: '無効なトークンです'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}