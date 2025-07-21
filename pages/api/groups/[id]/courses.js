// Group courses endpoint
const dataStore = require('../../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const groupId = parseInt(id)
  
  console.log(`グループコース管理API呼び出し: ${req.method} /api/groups/${id}/courses`)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - CORS preflight')
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
  
  // グループの存在確認
  const group = dataStore.getGroupById(groupId)
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'グループが見つかりません'
    })
  }
  
  if (req.method === 'GET') {
    try {
      console.log(`グループ ${groupId} のコース権限取得開始`)
      
      // グループに割り当てられたコースIDを取得
      const groupCourseIds = group.courseIds || []
      console.log('グループのコースID:', groupCourseIds)
      
      // 対応するコース情報を取得
      const allCourses = dataStore.getCourses()
      const groupCourses = allCourses.filter(course => groupCourseIds.includes(course.id))
      
      console.log(`グループコース取得完了: ${groupCourses.length}件`)
      
      return res.json({
        success: true,
        data: groupCourses
      })
    } catch (error) {
      console.error('グループコース取得エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'コース権限の取得に失敗しました',
        error: error.message
      })
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { courseIds } = req.body
      
      console.log(`グループ ${groupId} にコース追加:`, courseIds)
      
      if (!Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'コースIDの配列が必要です'
        })
      }
      
      // 現在のコースIDリストを取得
      const currentCourseIds = group.courseIds || []
      
      // 新しいコースIDを追加（重複を避ける）
      const newCourseIds = [...new Set([...currentCourseIds, ...courseIds])]
      
      // グループを更新
      const updatedGroup = dataStore.updateGroup(groupId, {
        ...group,
        courseIds: newCourseIds
      })
      
      console.log(`グループにコース追加完了: ${courseIds.length}件`)
      
      return res.json({
        success: true,
        data: updatedGroup,
        message: 'コース権限を追加しました'
      })
    } catch (error) {
      console.error('コース権限追加エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'コース権限の追加に失敗しました',
        error: error.message
      })
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { courseIds } = req.body
      
      console.log(`グループ ${groupId} からコース削除:`, courseIds)
      
      if (!Array.isArray(courseIds) || courseIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'コースIDの配列が必要です'
        })
      }
      
      // 現在のコースIDリストを取得
      const currentCourseIds = group.courseIds || []
      
      // 指定されたコースIDを削除
      const newCourseIds = currentCourseIds.filter(id => !courseIds.includes(id))
      
      // グループを更新
      const updatedGroup = dataStore.updateGroup(groupId, {
        ...group,
        courseIds: newCourseIds
      })
      
      console.log(`グループからコース削除完了: ${courseIds.length}件`)
      
      return res.json({
        success: true,
        data: updatedGroup,
        message: 'コース権限を削除しました'
      })
    } catch (error) {
      console.error('コース権限削除エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'コース権限の削除に失敗しました',
        error: error.message
      })
    }
  }
  
  console.log(`サポートされていないメソッド: ${req.method}`)
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Supported methods: GET, POST, DELETE, OPTIONS`
  })
}