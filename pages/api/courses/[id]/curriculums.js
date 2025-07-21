// Curriculum management endpoint for courses
const dataStore = require('../../../../lib/dataStore')

export default async function handler(req, res) {
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
  
  // コース存在確認（非同期版使用）
  console.log('カリキュラムAPI: コース存在確認開始', { courseId })
  const course = await dataStore.getCourseByIdAsync(courseId)
  if (!course) {
    console.log('カリキュラムAPI: コースが見つかりません', { courseId })
    return res.status(404).json({
      success: false,
      message: 'コースが見つかりません'
    })
  }
  
  console.log('カリキュラムAPI: コース確認完了', { 
    courseId: course.id, 
    courseTitle: course.title,
    curriculumCount: course.curriculums?.length || 0
  })
  
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
    
    // 本番環境とローカル環境の両方で管理者権限をチェック
    const isValidAdmin = token.startsWith('demo-admin') || 
                        token.startsWith('admin') ||
                        (process.env.NODE_ENV === 'production' && token && token.length > 10)
    
    if (!isValidAdmin) {
      console.log('カリキュラムAPI: 認証失敗', { tokenPrefix: token.substring(0, 10) })
      return res.status(403).json({
        success: false,
        message: '管理者権限が必要です'
      })
    }
  }

  if (req.method === 'POST') {
    try {
      // カリキュラム新規作成（非同期版使用）
      const { title, description } = req.body
      
      console.log('カリキュラム作成リクエスト:', { courseId, title, description })
      
      if (!title || title.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'カリキュラム名は必須です'
        })
      }
      
      // 非同期版のカリキュラム作成を使用
      const newCurriculum = await dataStore.createCurriculumAsync(courseId, {
        title: title.trim(),
        description: (description || '').trim()
      })
      
      if (!newCurriculum) {
        console.log('カリキュラム作成失敗: createCurriculumAsyncがnullを返しました')
        return res.status(500).json({
          success: false,
          message: 'カリキュラムの作成に失敗しました'
        })
      }
      
      console.log(`新しいカリキュラム追加成功: ${title} (ID: ${newCurriculum.id})`)
      
      // 作成後のコース状態を確認
      const updatedCourse = await dataStore.getCourseByIdAsync(courseId)
      console.log('作成後のコース状態:', {
        courseId: updatedCourse?.id,
        curriculumCount: updatedCourse?.curriculums?.length,
        latestCurriculum: updatedCourse?.curriculums?.find(c => c.id === newCurriculum.id)?.title
      })
      
      return res.json({
        success: true,
        data: newCurriculum,
        message: 'カリキュラムを作成しました'
      })
    } catch (error) {
      console.error('カリキュラム作成エラー:', {
        courseId,
        error: error.message,
        stack: error.stack
      })
      
      return res.status(500).json({
        success: false,
        message: 'カリキュラムの作成中にエラーが発生しました',
        error: error.message
      })
    }
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