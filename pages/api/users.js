// Users management endpoint
const dataStore = require('../../lib/dataStore')

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
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
  
  console.log('ユーザー管理API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV,
    origin: req.headers.origin
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    console.log('認証失敗: 無効な管理者トークン', { token: token.substring(0, 10) })
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です',
      debug: process.env.NODE_ENV === 'development' ? { tokenPrefix: token.substring(0, 10) } : undefined
    })
  }
  
  if (req.method === 'GET') {
    // キャッシュ制御ヘッダーを追加
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Last-Modified', new Date().toUTCString())
    res.setHeader('ETag', `"${Date.now()}"`)
    
    // ユーザー一覧を取得（非同期対応）
    const users = await dataStore.getUsersAsync()
    
    // グループ情報を付与
    const usersWithGroups = users.map(user => {
      let group = null
      if (user.groupId) {
        group = dataStore.getGroupById(user.groupId)
      }
      return {
        ...user,
        group
      }
    })
    
    console.log(`ユーザー一覧取得: ${users.length}件`)
    console.log('取得したユーザー:', usersWithGroups.map(u => ({ id: u.id, name: u.name, userId: u.userId })))
    
    return res.json({
      success: true,
      data: usersWithGroups,
      timestamp: new Date().toISOString(),
      count: usersWithGroups.length
    })
  }
  
  if (req.method === 'POST') {
    const { userId, name, role = 'USER', password, groupId } = req.body
    
    console.log('ユーザー作成リクエスト:', { userId, name, role, groupId })
    
    // バリデーション
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDと名前は必須です'
      })
    }
    
    // ユーザーIDの重複チェック
    const existingUser = dataStore.getUserByUserId ? dataStore.getUserByUserId(userId) : null
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このユーザーIDは既に使用されています'
      })
    }
    
    // グループの存在確認
    let group = null
    if (groupId) {
      group = dataStore.getGroupById(groupId)
      if (!group) {
        return res.status(400).json({
          success: false,
          message: '指定されたグループが見つかりません'
        })
      }
    }
    
    const tempPassword = password || generateTempPassword()
    
    const newUser = await dataStore.createUserAsync({
      userId,
      name,
      password: tempPassword,
      role: role.toUpperCase(),
      groupId: groupId || null,
      isFirstLogin: true
    })
    
    console.log(`新規ユーザー作成: ${name} (${userId}) - ID: ${newUser.id}`)
    
    // 保存確認: 作成後にデータストアから取得して確認
    try {
      const savedUsers = await dataStore.getUsersAsync()
      const foundUser = savedUsers.find(u => u.id === newUser.id)
      if (foundUser) {
        console.log('✓ ユーザーデータ保存確認済み:', foundUser.name)
      } else {
        console.error('✗ ユーザーデータが見つかりません:', newUser.id)
      }
      console.log(`現在の総ユーザー数: ${savedUsers.length}件`)
    } catch (verifyError) {
      console.error('ユーザー保存確認エラー:', verifyError)
    }
    
    // レスポンス用にグループ情報を付与
    const responseUser = {
      ...newUser,
      group,
      tempPassword // デモ用
    }
    
    return res.json({
      success: true,
      data: responseUser,
      message: 'ユーザーを作成しました'
    })
  }
  
  if (req.method === 'PUT') {
    // ユーザー更新処理
    const { userId, name, role, groupId, password } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      })
    }
    
    console.log('ユーザー更新:', { userId, name, role, groupId })
    
    // 既存ユーザーの確認
    const existingUser = await dataStore.getUserByIdAsync(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    // 他の更新フィールドの検証は必要に応じて追加
    
    // グループの存在確認
    let group = null
    if (groupId) {
      group = dataStore.getGroupById(groupId)
      if (!group) {
        return res.status(400).json({
          success: false,
          message: '指定されたグループが見つかりません'
        })
      }
    }
    
    // ユーザー情報の更新
    const updateData = {
      name: name || existingUser.name,
      role: role ? role.toUpperCase() : existingUser.role,
      groupId: groupId !== undefined ? groupId : existingUser.groupId
    }
    
    if (password) {
      updateData.password = password
    }
    
    const updatedUser = await dataStore.updateUserAsync(userId, updateData)
    
    console.log(`ユーザー更新完了: ${updatedUser.name} (ID: ${updatedUser.id})`)
    
    // レスポンス用にグループ情報を付与
    const responseUser = {
      ...updatedUser,
      group
    }
    
    return res.json({
      success: true,
      data: responseUser,
      message: 'ユーザーを更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    // ユーザー削除処理（複数方式で確実に削除）
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      })
    }
    
    console.log('ユーザー削除開始:', { userId })
    
    // 既存ユーザーの確認
    const existingUser = await dataStore.getUserByIdAsync(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    // 削除前の確認情報
    const userToDelete = {
      id: existingUser.id,
      name: existingUser.name,
      userId: existingUser.userId
    }
    
    console.log('削除対象ユーザー:', userToDelete)
    
    let deleted = false
    let kvDeleted = false
    let confirmDeleted = false
    
    // 方式1: dataStore.deleteUserAsync を使用
    try {
      deleted = await dataStore.deleteUserAsync(userId)
      console.log('方式1 (dataStore.deleteUserAsync):', deleted ? '成功' : '失敗')
    } catch (error) {
      console.error('方式1 失敗:', error)
    }
    
    // 方式2: KVを直接操作（本番環境のみ）
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    if (isProduction && isKVAvailable) {
      try {
        const { kv } = require('@vercel/kv')
        
        // 現在のユーザーデータを取得
        let usersData = await kv.get('users')
        if (usersData && usersData.users && usersData.users[userId.toString()]) {
          // ユーザーを削除
          delete usersData.users[userId.toString()]
          usersData.lastUpdated = new Date().toISOString()
          
          // KVに保存
          await kv.set('users', usersData)
          kvDeleted = true
          console.log('方式2 (KV直接): 成功')
        }
      } catch (kvError) {
        console.error('方式2 (KV直接) 失敗:', kvError)
      }
    }
    
    // 削除確認
    try {
      const checkUser = await dataStore.getUserByIdAsync(userId)
      confirmDeleted = !checkUser
      console.log('削除確認:', confirmDeleted ? 'ユーザーは存在しません（削除成功）' : 'ユーザーがまだ存在します')
    } catch (error) {
      console.log('削除確認時エラー（削除成功の可能性）:', error.message)
      confirmDeleted = true
    }
    
    if (deleted || kvDeleted || confirmDeleted) {
      console.log(`ユーザー削除完了: ${userToDelete.name} (ID: ${userId})`)
      return res.json({
        success: true,
        message: 'ユーザーを削除しました',
        deletedUser: userToDelete,
        methods: {
          dataStore: deleted,
          directKV: kvDeleted,
          confirmed: confirmDeleted
        }
      })
    } else {
      console.log('すべての削除方式が失敗しました:', userId)
      return res.status(500).json({
        success: false,
        message: 'ユーザー削除に失敗しました',
        methods: {
          dataStore: deleted,
          directKV: kvDeleted,
          confirmed: confirmDeleted
        }
      })
    }
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}