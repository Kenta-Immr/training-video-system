// Single group endpoint
export default function handler(req, res) {
  const { id } = req.query
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    const groupId = parseInt(id)
    
    // サンプルグループデータ
    const sampleGroups = {
      1: {
        id: 1,
        name: '開発部',
        code: 'DEV001',
        description: 'ソフトウェア開発チーム',
        createdAt: '2023-10-01T10:00:00Z',
        updatedAt: '2023-10-01T10:00:00Z',
        users: [
          {
            id: 3,
            name: '山田太郎',
            email: 'user1@example.com',
            role: 'USER',
            isFirstLogin: false,
            lastLoginAt: '2023-11-30T15:30:00Z',
            createdAt: '2023-11-10T10:00:00Z',
            updatedAt: '2023-11-30T15:30:00Z'
          }
        ]
      },
      2: {
        id: 2,
        name: '営業部',
        code: 'SALES001',
        description: '営業・マーケティングチーム',
        createdAt: '2023-10-01T10:00:00Z',
        updatedAt: '2023-10-01T10:00:00Z',
        users: [
          {
            id: 4,
            name: '佐藤花子',
            email: 'user2@example.com',
            role: 'USER',
            isFirstLogin: false,
            lastLoginAt: '2023-12-01T09:15:00Z',
            createdAt: '2023-11-05T10:00:00Z',
            updatedAt: '2023-12-01T09:15:00Z'
          },
          {
            id: 2,
            name: 'Test User',
            email: 'test@test.com',
            role: 'USER',
            isFirstLogin: true,
            lastLoginAt: null,
            createdAt: '2023-11-15T10:00:00Z',
            updatedAt: '2023-11-15T10:00:00Z'
          }
        ]
      },
      3: {
        id: 3,
        name: '人事部',
        code: 'HR001',
        description: '人事・総務チーム',
        createdAt: '2023-10-01T10:00:00Z',
        updatedAt: '2023-10-01T10:00:00Z',
        users: []
      }
    }
    
    const group = sampleGroups[groupId]
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'グループが見つかりません'
      })
    }
    
    return res.json({
      success: true,
      data: group
    })
  }
  
  if (req.method === 'PUT') {
    const { name, code, description } = req.body
    
    return res.json({
      success: true,
      data: {
        id: parseInt(id),
        name,
        code,
        description,
        updatedAt: new Date().toISOString()
      }
    })
  }
  
  if (req.method === 'DELETE') {
    return res.json({
      success: true,
      message: 'グループを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}