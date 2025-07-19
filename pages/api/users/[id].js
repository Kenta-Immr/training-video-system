// Single user endpoint
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
    const userId = parseInt(id)
    
    // サンプルユーザーデータ
    const sampleUsers = {
      1: {
        id: 1,
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
        groupId: null,
        group: null,
        isFirstLogin: false,
        lastLoginAt: '2023-12-01T10:00:00Z',
        createdAt: '2023-11-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
        progress: {
          totalVideos: 10,
          watchedVideos: 8,
          completedVideos: 6,
          totalWatchTime: 1800,
          completionRate: 60
        }
      },
      2: {
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
        updatedAt: '2023-11-15T10:00:00Z',
        progress: {
          totalVideos: 10,
          watchedVideos: 3,
          completedVideos: 2,
          totalWatchTime: 600,
          completionRate: 20
        }
      }
    }
    
    const user = sampleUsers[userId]
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    return res.json({
      success: true,
      data: user
    })
  }
  
  if (req.method === 'PUT') {
    const { email, name, role, groupId } = req.body
    
    return res.json({
      success: true,
      data: {
        id: parseInt(id),
        email,
        name,
        role,
        groupId,
        updatedAt: new Date().toISOString()
      }
    })
  }
  
  if (req.method === 'DELETE') {
    return res.json({
      success: true,
      message: 'ユーザーを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}