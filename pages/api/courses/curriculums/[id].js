// Individual curriculum management endpoint
const dataStore = require('../../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const curriculumId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // カリキュラム詳細取得
    // NOTE: dataStoreに直接カリキュラム取得機能がないため、コース経由で検索
    const courses = dataStore.getCourses()
    let curriculum = null
    
    for (const course of courses) {
      if (course.curriculums) {
        const found = course.curriculums.find(c => c.id === curriculumId)
        if (found) {
          curriculum = found
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
    
    return res.json({
      success: true,
      data: curriculum
    })
  }
  
  if (req.method === 'PUT') {
    // カリキュラム更新
    const { title, description } = req.body
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'カリキュラム名は必須です'
      })
    }
    
    const updatedCurriculum = dataStore.updateCurriculum(curriculumId, {
      title,
      description: description || ''
    })
    
    if (!updatedCurriculum) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    console.log(`カリキュラム更新: ${title} (ID: ${curriculumId})`)
    
    return res.json({
      success: true,
      data: updatedCurriculum,
      message: 'カリキュラムを更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    // カリキュラム削除
    const deleted = dataStore.deleteCurriculum(curriculumId)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    console.log(`カリキュラム削除: ID ${curriculumId}`)
    
    return res.json({
      success: true,
      message: 'カリキュラムを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}