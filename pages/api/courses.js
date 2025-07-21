// Courses endpoint
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

  if (req.method === 'GET') {
    // コース一覧を取得
    const courseList = dataStore.getCourses()
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

    const newCourse = dataStore.createCourse({
      title,
      description: description || '',
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
    })
    
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