// 実際のログデータに基づくリアル進捗統計
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - GET only'
    })
  }
  
  // 認証チェック
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    console.log('リアル進捗統計取得開始...')
    
    const { kv } = require('@vercel/kv')
    
    // 全データを並列取得
    const [usersData, groupsData, coursesData, videosData, logsData] = await Promise.all([
      kv.get('users'),
      kv.get('groups'),
      kv.get('courses'),
      kv.get('videos'),
      kv.get('viewing_logs')
    ])
    
    // 基本統計
    const totalUsers = usersData?.users ? Object.keys(usersData.users).length : 0
    const totalGroups = groupsData?.groups ? Object.keys(groupsData.groups).length : 0
    const totalCourses = coursesData?.courses ? Object.keys(coursesData.courses).length : 0
    const totalVideos = videosData?.videos ? Object.keys(videosData.videos).length : 0
    const totalLogs = logsData?.logs ? Object.keys(logsData.logs).length : 0
    
    console.log('基本統計:', { totalUsers, totalGroups, totalCourses, totalVideos, totalLogs })
    
    // 動画一覧を作成（コースとカリキュラム情報付き）
    const videoList = []
    if (coursesData?.courses) {
      for (const courseId in coursesData.courses) {
        const course = coursesData.courses[courseId]
        if (course.curriculums) {
          for (const curriculum of course.curriculums) {
            if (curriculum.videos) {
              for (const video of curriculum.videos) {
                videoList.push({
                  ...video,
                  courseId: course.id,
                  courseName: course.title,
                  curriculumId: curriculum.id,
                  curriculumName: curriculum.title
                })
              }
            }
          }
        }
      }
    }
    
    // 追加で videos テーブルからも取得（冗長性のため）
    if (videosData?.videos) {
      const existingVideoIds = new Set(videoList.map(v => v.id))
      for (const videoId in videosData.videos) {
        const video = videosData.videos[videoId]
        if (!existingVideoIds.has(video.id)) {
          videoList.push({
            ...video,
            courseName: 'Unknown Course',
            curriculumName: 'Unknown Curriculum'
          })
        }
      }
    }
    
    console.log(`動画一覧作成完了: ${videoList.length}件`)
    
    // ユーザー別進捗統計を計算
    const userStats = []
    if (usersData?.users) {
      for (const userId in usersData.users) {
        const user = usersData.users[userId]
        
        // このユーザーのログを取得
        const userLogs = []
        if (logsData?.logs) {
          for (const logId in logsData.logs) {
            const log = logsData.logs[logId]
            if (log.userId === user.id) {
              userLogs.push(log)
            }
          }
        }
        
        // 進捗計算
        const completedVideoIds = new Set()
        let totalWatchedSeconds = 0
        
        userLogs.forEach(log => {
          if (log.isCompleted) {
            completedVideoIds.add(log.videoId)
          }
          totalWatchedSeconds += log.watchedSeconds || 0
        })
        
        const completedVideos = completedVideoIds.size
        const progressRate = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0
        const watchRate = videoList.length > 0 ? Math.round((userLogs.length / videoList.length) * 100) : 0
        
        // グループ情報を取得
        let groupName = '未所属'
        if (user.groupId && groupsData?.groups) {
          const group = groupsData.groups[user.groupId.toString()]
          if (group) {
            groupName = group.name
          }
        }
        
        userStats.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          groupId: user.groupId,
          groupName: groupName,
          isFirstLogin: user.isFirstLogin,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          totalVideos: totalVideos,
          completedVideos: completedVideos,
          progressRate: progressRate,
          watchRate: watchRate,
          totalWatchedSeconds: totalWatchedSeconds,
          totalLogs: userLogs.length,
          lastActivity: userLogs.length > 0 ? Math.max(...userLogs.map(l => new Date(l.createdAt || l.lastWatchedAt || 0).getTime())) : null
        })
      }
    }
    
    // 全体統計
    const averageProgress = userStats.length > 0 
      ? Math.round(userStats.reduce((sum, stat) => sum + stat.progressRate, 0) / userStats.length)
      : 0
    
    const totalWatchTime = userStats.reduce((sum, stat) => sum + stat.totalWatchedSeconds, 0)
    const activeUsers = userStats.filter(stat => stat.totalLogs > 0).length
    
    // グループ別統計
    const groupStats = {}
    if (groupsData?.groups) {
      for (const groupId in groupsData.groups) {
        const group = groupsData.groups[groupId]
        const groupUsers = userStats.filter(stat => stat.groupId === group.id)
        
        groupStats[groupId] = {
          id: group.id,
          name: group.name,
          code: group.code,
          totalMembers: groupUsers.length,
          activeMembers: groupUsers.filter(stat => stat.totalLogs > 0).length,
          averageProgress: groupUsers.length > 0 
            ? Math.round(groupUsers.reduce((sum, stat) => sum + stat.progressRate, 0) / groupUsers.length)
            : 0,
          totalWatchTime: groupUsers.reduce((sum, stat) => sum + stat.totalWatchedSeconds, 0)
        }
      }
    }
    
    const finalStats = {
      summary: {
        totalUsers,
        totalGroups,
        totalCourses,
        totalVideos,
        totalLogs,
        activeUsers,
        averageProgress,
        totalWatchTimeHours: Math.round(totalWatchTime / 3600),
        dataTimestamp: new Date().toISOString()
      },
      userStats: userStats.sort((a, b) => b.progressRate - a.progressRate),
      groupStats: Object.values(groupStats),
      videoList: videoList.sort((a, b) => a.courseId - b.courseId || a.curriculumId - b.curriculumId),
      dataIntegrity: {
        usersIntact: !!usersData,
        groupsIntact: !!groupsData,
        coursesIntact: !!coursesData,
        videosIntact: !!videosData,
        logsIntact: !!logsData
      }
    }
    
    console.log('リアル進捗統計取得完了:', {
      users: totalUsers,
      videos: totalVideos,
      logs: totalLogs,
      averageProgress: averageProgress
    })
    
    return res.json({
      success: true,
      data: finalStats,
      timestamp: new Date().toISOString(),
      endpoint: 'real-progress-stats'
    })
    
  } catch (error) {
    console.error('リアル進捗統計エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'リアル進捗統計取得に失敗しました',
      error: error.message
    })
  }
}