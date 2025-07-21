// Curriculum management endpoint for courses
const dataStore = require('../../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const courseId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // コース存在確認
  const course = dataStore.getCourseById(courseId)
  if (!course) {
    return res.status(404).json({
      success: false,
      message: 'コースが見つかりません'
    })
  }
  
  // 認証チェック（POST、PUT、DELETEの場合は管理者のみ）
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
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

  if (req.method === 'POST') {
    // カリキュラム新規作成
    const { title, description } = req.body
    
    console.log('カリキュラム作成リクエスト:', { courseId, title, description })
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'カリキュラム名は必須です'
      })
    }
    
    const newCurriculum = dataStore.createCurriculum(courseId, {
      title,
      description: description || ''
    })
    
    if (!newCurriculum) {
      return res.status(500).json({
        success: false,
        message: 'カリキュラムの作成に失敗しました'
      })
    }
    
    console.log(`新しいカリキュラム追加: ${title} (ID: ${newCurriculum.id})`)
    
    return res.json({
      success: true,
      data: newCurriculum,
      message: 'カリキュラムを作成しました'
    })
  }
  
  if (req.method === 'GET') {
    // コースのカリキュラム一覧を取得
    return res.json({
      success: true,
      data: course.curriculums || []
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}