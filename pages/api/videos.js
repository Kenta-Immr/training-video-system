// Video management endpoint

// 共有データストア関数
function getCourseDataFromSharedStore() {
  if (global.courseData) {
    return global.courseData
  }
  // デフォルトデータ
  global.courseData = {
    1: {
      id: 1,
      title: "ウェブ開発入門",
      description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      curriculums: [
        {
          id: 1,
          title: "HTML基礎",
          description: "HTMLの基本構文と要素",
          courseId: 1,
          videos: [
            { 
              id: 1, 
              title: "HTML入門", 
              description: "HTMLとは何か", 
              videoUrl: "https://www.youtube.com/embed/UB1O30fR-EE", 
              curriculumId: 1,
              duration: 600
            }
          ]
        }
      ]
    }
  }
  return global.courseData
}

function getNextVideoId() {
  if (!global.nextVideoId) {
    global.nextVideoId = 100
  }
  return ++global.nextVideoId
}

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
  
  const courseDataStore = getCourseDataFromSharedStore()
  
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
    
    // カリキュラムを検索
    let curriculum = null
    let course = null
    
    for (const courseId in courseDataStore) {
      const courseData = courseDataStore[courseId]
      if (courseData.curriculums) {
        const foundCurriculum = courseData.curriculums.find(c => c.id === curriculumId)
        if (foundCurriculum) {
          curriculum = foundCurriculum
          course = courseData
          break
        }
      }
    }
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    // 新しい動画を作成
    const newVideo = {
      id: getNextVideoId(),
      title,
      description: description || '',
      videoUrl,
      curriculumId,
      duration: 0, // デフォルト
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // カリキュラムに動画を追加
    if (!curriculum.videos) {
      curriculum.videos = []
    }
    curriculum.videos.push(newVideo)
    
    console.log(`新しい動画追加: ${title} (ID: ${newVideo.id}) → カリキュラム: ${curriculum.title}`)
    
    return res.json({
      success: true,
      data: newVideo,
      message: '動画を追加しました'
    })
  }
  
  if (req.method === 'GET') {
    // 全動画一覧を取得（管理用）
    const allVideos = []
    
    for (const courseId in courseDataStore) {
      const courseData = courseDataStore[courseId]
      if (courseData.curriculums) {
        courseData.curriculums.forEach(curriculum => {
          if (curriculum.videos) {
            curriculum.videos.forEach(video => {
              allVideos.push({
                ...video,
                courseName: courseData.title,
                curriculumName: curriculum.title
              })
            })
          }
        })
      }
    }
    
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