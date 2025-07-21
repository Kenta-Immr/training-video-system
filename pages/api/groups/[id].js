// Single group endpoint
const dataStore = require('../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const groupId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE')
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
  
  if (req.method === 'GET') {
    const group = dataStore.getGroupById(groupId)
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'グループが見つかりません'
      })
    }
    
    // グループのメンバーを取得
    const users = dataStore.getUsers()
    const groupMembers = users.filter(user => user.groupId === groupId)
    
    const groupWithMembers = {
      ...group,
      users: groupMembers,
      memberCount: groupMembers.length
    }
    
    return res.json({
      success: true,
      data: groupWithMembers
    })
  }
  
  if (req.method === 'PUT') {
    const { name, code, description, courseIds } = req.body
    
    // バリデーション
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'グループ名とコードは必須です'
      })
    }
    
    // コードの重複チェック（自分以外）
    const existingGroup = dataStore.getGroupByCode(code)
    if (existingGroup && existingGroup.id !== groupId) {
      return res.status(400).json({
        success: false,
        message: 'このグループコードは既に使用されています'
      })
    }
    
    const updatedGroup = dataStore.updateGroup(groupId, {
      name,
      code,
      description: description || '',
      courseIds: courseIds || []
    })
    
    return res.json({
      success: true,
      data: updatedGroup,
      message: 'グループ情報を更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    const deletedGroup = dataStore.deleteGroup(groupId)
    
    return res.json({
      success: true,
      data: deletedGroup,
      message: 'グループを削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}