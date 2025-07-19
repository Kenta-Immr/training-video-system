// Statistics endpoint
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
    // 統計データを返す
    return res.json({
      success: true,
      data: {
        userStats: [
          {
            id: 1,
            name: 'Admin User',
            email: 'admin@test.com',
            completedVideos: 8,
            totalVideos: 10,
            progressRate: 80,
            totalWatchedSeconds: 1800
          },
          {
            id: 2,
            name: 'Test User',
            email: 'test@test.com',
            completedVideos: 3,
            totalVideos: 10,
            progressRate: 30,
            totalWatchedSeconds: 900
          },
          {
            id: 3,
            name: '山田太郎',
            email: 'user1@example.com',
            completedVideos: 6,
            totalVideos: 10,
            progressRate: 60,
            totalWatchedSeconds: 1200
          },
          {
            id: 4,
            name: '佐藤花子',
            email: 'user2@example.com',
            completedVideos: 9,
            totalVideos: 10,
            progressRate: 90,
            totalWatchedSeconds: 2100
          }
        ],
        totalUsers: 4,
        totalVideos: 10,
        totalGroups: 3,
        averageProgress: 65
      }
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}