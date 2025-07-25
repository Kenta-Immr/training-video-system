// Single course endpoint
const dataStore = require('../../../lib/dataStore')

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
    try {
      const courseId = parseInt(id)
      
      console.log('コース取得リクエスト:', { courseId, hasGetCourseById: typeof dataStore.getCourseById })
      
      if (!dataStore.getCourseById) {
        return res.status(500).json({
          success: false,
          message: 'getCourseById関数が利用できません'
        })
      }
      
      const course = dataStore.getCourseById(courseId)
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'コースが見つかりません'
        })
      }
      
      console.log(`コース取得成功: ${course.title} (カリキュラム数: ${course.curriculums?.length || 0})`)
      
      return res.json({
        success: true,
        data: course
      })
    } catch (error) {
      console.error('コース取得エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'コース取得中にエラーが発生しました'
      })
    }
  }
  
  if (req.method === 'PUT') {
    const courseId = parseInt(id)
    const { title, description, thumbnailUrl } = req.body
    
    console.log('コース更新リクエスト:', { courseId, title, description, thumbnailUrl })
    
    const updatedCourse = dataStore.updateCourse(courseId, {
      title,
      description,
      thumbnailUrl
    })
    
    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: 'コースが見つかりません'
      })
    }
    
    console.log('コース更新完了:', updatedCourse)
    
    return res.json({
      success: true,
      data: updatedCourse,
      message: 'コースを更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    const courseId = parseInt(id)
    
    const deleted = dataStore.deleteCourse(courseId)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'コースが見つかりません'
      })
    }
    
    return res.json({
      success: true,
      message: 'コースを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}