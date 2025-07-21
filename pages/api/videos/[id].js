// Individual video management endpoint

// 共有データストア関数
function getCourseDataFromSharedStore() {
  if (global.courseData) {
    return global.courseData
  }
  return {}
}

export default function handler(req, res) {
  const { id } = req.query
  const videoId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
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
  
  const courseDataStore = getCourseDataFromSharedStore()
  
  // 動画を検索
  let targetVideo = null
  let targetCurriculum = null
  let targetCourse = null
  
  for (const courseId in courseDataStore) {
    const courseData = courseDataStore[courseId]
    if (courseData.curriculums) {
      for (const curriculum of courseData.curriculums) {
        if (curriculum.videos) {
          const foundVideo = curriculum.videos.find(v => v.id === videoId)
          if (foundVideo) {
            targetVideo = foundVideo
            targetCurriculum = curriculum
            targetCourse = courseData
            break
          }
        }
      }
      if (targetVideo) break
    }
  }
  
  if (!targetVideo) {
    return res.status(404).json({
      success: false,
      message: '動画が見つかりません'
    })
  }
  
  if (req.method === 'GET') {
    console.log(`動画取得: ${targetVideo.title} (ID: ${videoId})`)
    
    return res.json({
      success: true,
      data: {
        ...targetVideo,
        courseName: targetCourse.title,
        curriculumName: targetCurriculum.title
      }
    })
  }
  
  if (req.method === 'PUT') {
    const { title, description, videoUrl } = req.body
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'タイトルは必須です'
      })
    }
    
    // 動画情報を更新
    targetVideo.title = title
    targetVideo.description = description || targetVideo.description
    if (videoUrl) {
      targetVideo.videoUrl = videoUrl
    }
    targetVideo.updatedAt = new Date().toISOString()
    
    console.log(`動画更新: ${title} (ID: ${videoId})`)
    
    return res.json({
      success: true,
      data: targetVideo,
      message: '動画情報を更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    // 動画を削除
    const videoIndex = targetCurriculum.videos.findIndex(v => v.id === videoId)
    if (videoIndex > -1) {
      targetCurriculum.videos.splice(videoIndex, 1)
    }
    
    console.log(`動画削除: ${targetVideo.title} (ID: ${videoId})`)
    
    return res.json({
      success: true,
      data: targetVideo,
      message: '動画を削除しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}