// Video logs endpoint
export default function handler(req, res) {
  const { id } = req.query
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // 指定された動画IDの視聴ログを返す
    const videoId = parseInt(id)
    
    // サンプルログデータ
    const sampleLogs = [
      {
        id: 1,
        userId: 1,
        videoId: videoId,
        watchedSeconds: 180,
        isCompleted: true,
        lastWatchedAt: '2023-12-01T10:30:00Z',
        user: {
          id: 1,
          name: 'Admin User',
          email: 'admin@test.com'
        }
      },
      {
        id: 2,
        userId: 3,
        videoId: videoId,
        watchedSeconds: 120,
        isCompleted: false,
        lastWatchedAt: '2023-11-30T15:45:00Z',
        user: {
          id: 3,
          name: '山田太郎',
          email: 'user1@example.com'
        }
      },
      {
        id: 3,
        userId: 4,
        videoId: videoId,
        watchedSeconds: 200,
        isCompleted: true,
        lastWatchedAt: '2023-12-01T09:15:00Z',
        user: {
          id: 4,
          name: '佐藤花子',
          email: 'user2@example.com'
        }
      }
    ]
    
    return res.json({
      success: true,
      data: sampleLogs
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}