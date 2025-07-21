// Statistics endpoint
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
  
  // 認証チェック（管理者のみ）
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  if (!token.startsWith('demo-admin')) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  if (req.method === 'GET') {
    try {
      console.log('統計データ取得開始')
      
      // 基本統計を取得
      const stats = dataStore.getViewingStats()
      console.log('基本統計取得:', stats)
      
      // ユーザー別統計を計算
      const users = dataStore.getUsers()
      console.log('ユーザー一覧取得:', users.length, '件')
      
      const userStats = users.map(user => {
        try {
          const userLogs = dataStore.getUserViewingLogs(user.id)
          const completedLogs = userLogs.filter(log => log.isCompleted)
          const totalWatchedSeconds = userLogs.reduce((sum, log) => sum + (log.watchedSeconds || 0), 0)
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            completedVideos: completedLogs.length,
            totalVideos: stats.totalVideos,
            progressRate: stats.totalVideos > 0 ? Math.round((completedLogs.length / stats.totalVideos) * 100) : 0,
            totalWatchedSeconds: totalWatchedSeconds
          }
        } catch (userError) {
          console.error(`ユーザー ${user.id} の統計処理エラー:`, userError)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            completedVideos: 0,
            totalVideos: stats.totalVideos,
            progressRate: 0,
            totalWatchedSeconds: 0
          }
        }
      })
      
      const groups = dataStore.getGroups()
      console.log('グループ一覧取得:', groups.length, '件')
      
      const averageProgress = userStats.length > 0 
        ? Math.round(userStats.reduce((sum, stat) => sum + stat.progressRate, 0) / userStats.length)
        : 0
      
      console.log('統計データ取得完了')
      
      return res.json({
        success: true,
        data: {
          userStats: userStats,
          totalUsers: stats.totalUsers,
          totalVideos: stats.totalVideos,
          totalGroups: groups.length,
          totalViewingLogs: stats.totalViewingLogs,
          completedViewings: stats.completedViewings,
          averageProgress: averageProgress
        }
      })
    } catch (error) {
      console.error('統計データ取得エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'サーバー内部エラーが発生しました',
        error: error.message
      })
    }
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}