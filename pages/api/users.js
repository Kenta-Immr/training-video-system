// Users management endpoint
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // ユーザー一覧を返す
    return res.json({
      success: true,
      data: [
        {
          id: 1,
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'ADMIN',
          groupId: null,
          isFirstLogin: false,
          lastLoginAt: '2023-12-01T10:00:00Z',
          createdAt: '2023-11-01T10:00:00Z',
          updatedAt: '2023-12-01T10:00:00Z'
        },
        {
          id: 2,
          email: 'test@test.com',
          name: 'Test User',
          role: 'USER',
          groupId: 1,
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: '2023-11-15T10:00:00Z',
          updatedAt: '2023-11-15T10:00:00Z'
        },
        {
          id: 3,
          email: 'user1@example.com',
          name: '山田太郎',
          role: 'USER',
          groupId: 1,
          isFirstLogin: false,
          lastLoginAt: '2023-11-30T15:30:00Z',
          createdAt: '2023-11-10T10:00:00Z',
          updatedAt: '2023-11-30T15:30:00Z'
        },
        {
          id: 4,
          email: 'user2@example.com',
          name: '佐藤花子',
          role: 'USER',
          groupId: 2,
          isFirstLogin: false,
          lastLoginAt: '2023-12-01T09:15:00Z',
          createdAt: '2023-11-05T10:00:00Z',
          updatedAt: '2023-12-01T09:15:00Z'
        }
      ]
    })
  }
  
  if (req.method === 'POST') {
    const { email, name, password, role, groupId } = req.body
    
    // 新しいユーザーを作成（模擬）
    return res.json({
      success: true,
      data: {
        id: Date.now(),
        email,
        name,
        role: role || 'USER',
        groupId: groupId || null,
        isFirstLogin: true,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}