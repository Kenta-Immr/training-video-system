// Courses endpoint

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
            { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
            { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 }
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
            { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
            { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 }
          ]
        }
      ]
    }
  }
  return global.courseData
}

function getNextCourseId() {
  if (!global.nextCourseId) {
    global.nextCourseId = 3
  }
  return ++global.nextCourseId
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
  
  // 認証チェック（POST以外のGETは公開）
  if (req.method !== 'GET') {
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
  }

  const courses = getCourseDataFromSharedStore()

  if (req.method === 'GET') {
    // コース一覧を取得
    const courseList = Object.values(courses)
    console.log(`コース一覧取得: ${courseList.length}件`)
    
    return res.json({
      success: true,
      data: courseList
    })
  }

  if (req.method === 'POST') {
    // 新規コース作成
    const { title, description, thumbnailUrl } = req.body
    
    console.log('新規コース作成リクエスト:', { title, description, thumbnailUrl })
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'コースタイトルは必須です'
      })
    }

    const newCourse = {
      id: getNextCourseId(),
      title,
      description: description || '',
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      curriculums: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 新しいコースを追加
    courses[newCourse.id] = newCourse
    
    console.log(`新規コース作成完了: ${title} (ID: ${newCourse.id})`)

    return res.json({
      success: true,
      data: newCourse,
      message: 'コースを作成しました'
    })
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}