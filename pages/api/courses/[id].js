// Single course endpoint

// 共有データストア（実際の実装では外部データベースを使用）
let courseData = {
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
          },
          { 
            id: 2, 
            title: "基本タグ", 
            description: "よく使うHTMLタグ", 
            videoUrl: "https://www.youtube.com/embed/ok-plXXHlWw", 
            curriculumId: 1,
            duration: 480
          }
        ]
      }
    ]
  },
  2: {
    id: 2,
    title: "データベース設計",
    description: "SQL、NoSQLの基礎とデータベース設計の実践的な学習",
    thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
    curriculums: [
      {
        id: 2,
        title: "SQL基礎",
        description: "SQLの基本構文",
        courseId: 2,
        videos: [
          { 
            id: 3, 
            title: "SELECT文", 
            description: "データの抽出", 
            videoUrl: "https://www.youtube.com/embed/HXV3zeQKqGY", 
            curriculumId: 2,
            duration: 720
          },
          { 
            id: 4, 
            title: "INSERT文", 
            description: "データの挿入", 
            videoUrl: "https://www.youtube.com/embed/9ylj9NR0Lcg", 
            curriculumId: 2,
            duration: 540
          }
        ]
      }
    ]
  }
}

// カリキュラム追加データを外部から取得する関数
function getCourseDataFromSharedStore() {
  // 実際の実装では、他のAPIエンドポイントと同じデータストアを参照
  // ここでは簡易的に global オブジェクトを使用
  if (global.courseData) {
    return global.courseData
  }
  global.courseData = courseData
  return global.courseData
}

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
    const courseId = parseInt(id)
    
    // 最新のコースデータを取得
    const courses = getCourseDataFromSharedStore()
    const course = courses[courseId]
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'コースが見つかりません'
      })
    }
    
    console.log(`コース取得: ${course.title} (カリキュラム数: ${course.curriculums.length})`)
    
    return res.json({
      success: true,
      data: course
    })
  }
  
  if (req.method === 'PUT') {
    const courseId = parseInt(id)
    const { title, description, thumbnailUrl } = req.body
    
    console.log('コース更新リクエスト:', { courseId, title, description, thumbnailUrl })
    
    // 共有データから現在のコースを取得
    const courses = getCourseDataFromSharedStore()
    const course = courses[courseId]
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'コースが見つかりません'
      })
    }
    
    // コースデータを更新
    course.title = title || course.title
    course.description = description || course.description
    course.thumbnailUrl = thumbnailUrl || course.thumbnailUrl
    course.updatedAt = new Date().toISOString()
    
    console.log('コース更新完了:', course)
    
    return res.json({
      success: true,
      data: course,
      message: 'コースを更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    return res.json({
      success: true,
      message: 'コースを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}