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
  
  if (req.method === 'POST') {
    // カリキュラム新規作成
    const { title, description } = req.body
    
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