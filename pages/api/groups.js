// Groups management endpoint
const dataStore = require('../../lib/dataStore')

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
  
  console.log('グループ管理API認証チェック:', { 
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
    
    // グループ一覧を取得（非同期対応）
    const groups = await dataStore.getGroupsAsync()
    
    // 各グループにメンバー数を追加
    const groupsWithMembers = await Promise.all(groups.map(async group => {
      const users = await dataStore.getUsersAsync()
      const members = users.filter(user => user.groupId === group.id)
      
      return {
        ...group,
        memberCount: members.length,
        members: members,
        users: members // 互換性のため
      }
    }))
    
    console.log(`グループ一覧取得: ${groups.length}件`)
    console.log('取得したグループ:', groupsWithMembers.map(g => ({ id: g.id, name: g.name, code: g.code, memberCount: g.memberCount })))
    
    return res.json({
      success: true,
      data: groupsWithMembers,
      timestamp: new Date().toISOString(),
      count: groupsWithMembers.length
    })
  }
  
  if (req.method === 'POST') {
    const { name, code, description, courseIds } = req.body
    
    console.log('グループ作成リクエスト:', { name, code, description, courseIds })
    
    // バリデーション
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'グループ名とコードは必須です'
      })
    }
    
    // コードの重複チェック
    const existingGroup = dataStore.getGroupByCode(code)
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'このグループコードは既に使用されています'
      })
    }
    
    const newGroup = await dataStore.createGroupAsync({
      name,
      code,
      description: description || '',
      courseIds: courseIds || []
    })
    
    console.log(`新規グループ作成: ${name} (${code}) - ID: ${newGroup.id}`)
    
    return res.json({
      success: true,
      data: {
        ...newGroup,
        memberCount: 0,
        members: []
      },
      message: 'グループを作成しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}