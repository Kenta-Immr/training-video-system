// Video management endpoint
const dataStore = require('../../lib/dataStore')

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
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
  
  if (req.method === 'POST') {
    // 新しい動画をカリキュラムに追加
    const { title, description, videoUrl, curriculumId } = req.body
    
    console.log('動画作成リクエスト:', { title, description, videoUrl, curriculumId })
    
    if (!title || !curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'タイトルとカリキュラムIDは必須です'
      })
    }
    
    // URLが空の場合は、通常ファイルアップロード経由で呼ばれる
    if (!videoUrl || videoUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '動画URLが必要です。ファイルアップロードの場合は /api/videos/upload を使用してください'
      })
    }
    
    const newVideo = dataStore.createVideo({
      title,
      description: description || '',
      videoUrl,
      curriculumId,
      duration: 0 // デフォルト
    })
    
    if (!newVideo) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    console.log(`新しい動画追加: ${title} (ID: ${newVideo.id})`)
    
    return res.json({
      success: true,
      data: newVideo,
      message: '動画を追加しました'
    })
  }
  
  if (req.method === 'GET') {
    // 全動画一覧を取得（管理用）
    const allVideos = []
    const courses = dataStore.getCourses()
    
    courses.forEach(course => {
      if (course.curriculums) {
        course.curriculums.forEach(curriculum => {
          if (curriculum.videos) {
            curriculum.videos.forEach(video => {
              allVideos.push({
                ...video,
                courseName: course.title,
                curriculumName: curriculum.title
              })
            })
          }
        })
      }
    })
    
    console.log(`動画一覧取得: ${allVideos.length}件`)
    
    return res.json({
      success: true,
      data: allVideos
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}