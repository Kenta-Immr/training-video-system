// Group progress endpoint
const dataStore = require('../../../../lib/dataStore')

// 実際の進捗データを生成
function generateProgressData(groupId) {
  // データストアからグループデータを取得
  const group = dataStore.getGroupById(groupId)
  if (!group) {
    return null
  }
  
  // データストアからコースデータを取得
  const courses = dataStore.getCourses()
  
  // データストアからグループメンバーを取得
  const allUsers = dataStore.getUsers()
  const groupMembers = allUsers.filter(user => user.groupId === groupId)
  
  // 全動画数を計算
  let totalVideos = 0
  courses.forEach(course => {
    course.curriculums.forEach(curriculum => {
      totalVideos += curriculum.videos.length
    })
  })
  
  // 各メンバーの進捗を計算
  const members = groupMembers.map(user => {
    const userLogs = dataStore.getUserViewingLogs(user.id)
    const completedLogs = userLogs.filter(log => log.isCompleted)
    const watchedLogs = userLogs.filter(log => log.watchedSeconds > 0)
    
    return {
      user,
      progress: {
        totalVideos,
        watchedVideos: watchedLogs.length,
        completedVideos: completedLogs.length,
        completionRate: totalVideos > 0 ? Math.round((completedLogs.length / totalVideos) * 100) : 0,
        watchRate: totalVideos > 0 ? Math.round((watchedLogs.length / totalVideos) * 100) : 0
      }
    }
  })
  
  return {
    group,
    courses,
    members
  }
}

export default function handler(req, res) {
  const { id } = req.query
  const groupId = parseInt(id)
  
  console.log(`グループ進捗API呼び出し: ID=${id}, 解析後ID=${groupId}`)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for group progress')
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // リクエストヘッダーのログ
    console.log('Request headers:', {
      authorization: req.headers.authorization,
      'user-agent': req.headers['user-agent']
    })
    
    // グループIDの妥当性チェック
    if (isNaN(groupId)) {
      console.log(`無効なグループID: ${id}`)
      return res.status(400).json({
        success: false,
        message: '無効なグループIDです'
      })
    }
    
    try {
      // 実際の進捗データを生成
      const progressData = generateProgressData(groupId)
      
      if (!progressData) {
        console.log(`グループが見つかりません: ${groupId}`)
        return res.status(404).json({
          success: false,
          message: 'グループが見つかりません'
        })
      }
      
      console.log(`グループ進捗データ生成成功: ${progressData.group.name}`)
      console.log(`メンバー数: ${progressData.members.length}`)
      console.log(`コース数: ${progressData.courses.length}`)
      
      return res.status(200).json({
        success: true,
        data: progressData,
        message: 'グループ進捗データを正常に取得しました'
      })
    } catch (error) {
      console.error('グループ進捗データ生成エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'サーバー内部エラーが発生しました',
        error: error.message
      })
    }
  }
  
  console.log(`サポートされていないメソッド: ${req.method}`)
  return res.status(405).json({ 
    success: false,
    message: 'Method not allowed' 
  })
}