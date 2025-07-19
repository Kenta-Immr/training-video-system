// First login pending users endpoint
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
    // 初回ログイン未完了のユーザー一覧を返す
    return res.json({
      success: true,
      data: [
        {
          id: 2,
          email: 'test@test.com',
          name: 'Test User',
          role: 'USER',
          groupId: 1,
          group: {
            id: 1,
            name: '開発部',
            code: 'DEV001'
          },
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: '2023-11-15T10:00:00Z',
          updatedAt: '2023-11-15T10:00:00Z'
        },
        {
          id: 5,
          email: 'newuser@example.com',
          name: '新規ユーザー',
          role: 'USER',
          groupId: 2,
          group: {
            id: 2,
            name: '営業部',
            code: 'SALES001'
          },
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: '2023-12-01T14:00:00Z',
          updatedAt: '2023-12-01T14:00:00Z'
        }
      ]
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}