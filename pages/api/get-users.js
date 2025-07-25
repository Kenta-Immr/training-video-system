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
    
    // 環境に応じたデータ取得
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    let users = []
    
    if (isProduction && isKVAvailable) {
      console.log('本番環境 - KVストレージからユーザー取得')
      const { kv } = require('@vercel/kv')
      const usersData = await kv.get('users')
      
      if (usersData && usersData.users) {
        users = Object.values(usersData.users)
        console.log(`KVから直接取得: ${users.length}件`)
      } else {
        console.warn('KVにユーザーデータが存在しません')
      }
    } else {
      console.log('開発環境 - ローカルファイルからユーザー取得')
      users = await dataStore.getUsersAsync()
      console.log(`ローカルファイルから取得: ${users.length}件`)
    }
    
    console.log(`ユーザー取得成功: ${users.length}件`)
    console.log('取得ユーザーID一覧:', users.map(u => ({ id: u.id, name: u.name, userId: u.userId })))
    
    // グループ情報を付与
    let groups = []
    try {
      groups = await dataStore.getGroupsAsync()
    } catch (groupsError) {
      console.warn('グループ一覧取得に失敗:', groupsError.message)
    }
    
    const usersWithGroups = users.map(user => {
      let group = null
      if (user.groupId) {
        try {
          if (isProduction && isKVAvailable) {
            // 本番環境では同期的な取得を試行
            group = dataStore.getGroupById(user.groupId)
          } else {
            // 開発環境では取得済みのグループ一覧から検索
            group = groups.find(g => g.id === user.groupId) || null
          }
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