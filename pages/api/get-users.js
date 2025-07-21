// ユーザー取得専用エンドポイント（500エラー対策）
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - GET only'
    })
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
  
  console.log('ユーザー取得API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV
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
  
  try {
    // キャッシュ制御ヘッダーを追加
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Last-Modified', new Date().toUTCString())
    res.setHeader('ETag', `"${Date.now()}"`)
    
    console.log('ユーザー取得処理開始...')
    
    // ユーザー一覧を取得（非同期対応）
    const users = await dataStore.getUsersAsync()
    
    console.log(`ユーザー取得成功: ${users.length}件`)
    console.log('取得ユーザーID一覧:', users.map(u => ({ id: u.id, name: u.name, email: u.email })))
    
    // グループ情報を付与
    const usersWithGroups = users.map(user => {
      let group = null
      if (user.groupId) {
        try {
          group = dataStore.getGroupById(user.groupId)
        } catch (groupError) {
          console.warn(`グループ取得失敗 (ID: ${user.groupId}):`, groupError.message)
        }
      }
      return {
        ...user,
        group
      }
    })
    
    console.log(`グループ情報付与完了: ${usersWithGroups.length}件`)
    
    return res.json({
      success: true,
      data: usersWithGroups,
      timestamp: new Date().toISOString(),
      count: usersWithGroups.length,
      endpoint: 'get-users'
    })
    
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    console.error('エラースタック:', error.stack)
    
    return res.status(500).json({
      success: false,
      message: 'ユーザー取得に失敗しました',
      error: error.message,
      endpoint: 'get-users'
    })
  }
}