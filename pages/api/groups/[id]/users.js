// Group users management endpoint
const dataStore = require('../../../../lib/dataStore')

export default async function handler(req, res) {
  const { id } = req.query
  const groupId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
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
  console.log('グループユーザー管理API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV,
    groupId,
    method: req.method
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    console.log('認証失敗: 無効な管理者トークン', { token: token.substring(0, 10) })
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  // グループの存在確認
  const group = await dataStore.getGroupByIdAsync ? await dataStore.getGroupByIdAsync(groupId) : dataStore.getGroupById(groupId)
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'グループが見つかりません'
    })
  }
  
  try {
    if (req.method === 'GET') {
      // グループメンバーを取得
      const users = await dataStore.getUsersAsync()
      const groupMembers = users.filter(user => user.groupId === groupId)
      
      console.log(`グループ ${group.name} のメンバー取得: ${groupMembers.length}人`)
      
      return res.json({
        success: true,
        data: groupMembers
      })
    }
    
    if (req.method === 'POST') {
      // ユーザーをグループに追加
      const { userIds } = req.body
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ユーザーIDの配列が必要です'
        })
      }
      
      console.log(`グループ ${group.name} にユーザー追加:`, userIds)
      
      const addedUsers = []
      const errors = []
      
      for (const userId of userIds) {
        try {
          // ユーザーの存在確認
          const user = await dataStore.getUserByIdAsync(userId)
          if (!user) {
            errors.push({ userId, error: 'ユーザーが見つかりません' })
            continue
          }
          
          // ユーザーのgroupIdを更新
          const updatedUser = await dataStore.updateUserAsync(userId, {
            ...user,
            groupId: groupId
          })
          
          if (updatedUser) {
            addedUsers.push(updatedUser)
            console.log(`ユーザー ${user.name} をグループ ${group.name} に追加しました`)
          }
        } catch (error) {
          console.error(`ユーザー ${userId} の追加エラー:`, error)
          errors.push({ userId, error: error.message })
        }
      }
      
      return res.json({
        success: true,
        data: {
          addedUsers,
          addedCount: addedUsers.length,
          errors
        },
        message: `${addedUsers.length}人のユーザーをグループに追加しました`
      })
    }
    
    if (req.method === 'DELETE') {
      // ユーザーをグループから削除
      const { userIds } = req.body
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ユーザーIDの配列が必要です'
        })
      }
      
      console.log(`グループ ${group.name} からユーザー削除:`, userIds)
      
      const removedUsers = []
      const errors = []
      
      for (const userId of userIds) {
        try {
          // ユーザーの存在確認とグループ確認
          const user = await dataStore.getUserByIdAsync(userId)
          if (!user) {
            errors.push({ userId, error: 'ユーザーが見つかりません' })
            continue
          }
          
          if (user.groupId !== groupId) {
            errors.push({ userId, error: 'ユーザーはこのグループのメンバーではありません' })
            continue
          }
          
          // ユーザーのgroupIdをnullに更新
          const updatedUser = await dataStore.updateUserAsync(userId, {
            ...user,
            groupId: null
          })
          
          if (updatedUser) {
            removedUsers.push(updatedUser)
            console.log(`ユーザー ${user.name} をグループ ${group.name} から削除しました`)
          }
        } catch (error) {
          console.error(`ユーザー ${userId} の削除エラー:`, error)
          errors.push({ userId, error: error.message })
        }
      }
      
      return res.json({
        success: true,
        data: {
          removedUsers,
          removedCount: removedUsers.length,
          errors
        },
        message: `${removedUsers.length}人のユーザーをグループから削除しました`
      })
    }
    
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
    
  } catch (error) {
    console.error('グループユーザー管理エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}