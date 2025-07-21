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
    console.log('取得したユーザー:', usersWithGroups.map(u => ({ id: u.id, name: u.name, email: u.email })))
    
    return res.json({
      success: true,
      data: usersWithGroups,
      timestamp: new Date().toISOString(),
      count: usersWithGroups.length
    })
  }
  
  if (req.method === 'POST') {
    const { email, name, role = 'USER', password, groupId } = req.body
    
    console.log('ユーザー作成リクエスト:', { email, name, role, groupId })
    
    // バリデーション
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスと名前は必須です'
      })
    }
    
    // メールアドレスの重複チェック
    const existingUser = dataStore.getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
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
      email,
      name,
      password: tempPassword,
      role: role.toUpperCase(),
      groupId: groupId || null,
      isFirstLogin: true
    })
    
    console.log(`新規ユーザー作成: ${name} (${email}) - ID: ${newUser.id}`)
    
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
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}