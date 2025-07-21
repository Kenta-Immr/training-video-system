// Viewing logs management endpoint
const dataStore = require('../../lib/dataStore')

// デモユーザー用トークンマッピング
const demoTokenToUser = {
  'demo-admin': { email: 'admin@example.com' },
  'demo-user': { email: 'user@example.com' }
}

function getUserFromToken(token) {
  if (token.startsWith('demo-')) {
    const tokenUser = demoTokenToUser[token]
    if (tokenUser) {
      return dataStore.getUserByEmail(tokenUser.email)
    }
  }
  return null
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // 認証チェック
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  const currentUser = getUserFromToken(token)
  
  if (!currentUser) {
    return res.status(401).json({
      success: false,
      message: '無効なトークンです'
    })
  }
  
  if (req.method === 'GET') {
    // 自分の視聴ログを取得（管理者は全ユーザーのログを取得可能）
    let logs
    if (currentUser.role === 'ADMIN') {
      logs = dataStore.getAllViewingLogs()
    } else {
      logs = dataStore.getUserViewingLogs(currentUser.id)
    }
    
    console.log(`視聴ログ取得: ${logs.length}件`)
    
    return res.json({
      success: true,
      data: logs
    })
  }
  
  if (req.method === 'POST') {
    // 視聴ログの保存・更新
    const { videoId, watchedSeconds, isCompleted } = req.body
    
    console.log('視聴ログ保存リクエスト:', { 
      userId: currentUser.id, 
      videoId, 
      watchedSeconds, 
      isCompleted 
    })
    
    // バリデーション
    if (!videoId || watchedSeconds === undefined) {
      return res.status(400).json({
        success: false,
        message: '動画IDと視聴秒数は必須です'
      })
    }
    
    // 動画の存在確認
    const video = dataStore.getVideoById(videoId)
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '動画が見つかりません'
      })
    }
    
    const savedLog = dataStore.saveViewingLog({
      userId: currentUser.id,
      videoId: videoId,
      watchedSeconds: watchedSeconds,
      totalDuration: video.duration || 0,
      isCompleted: isCompleted || false
    })
    
    console.log(`視聴ログ保存完了: ユーザー${currentUser.id} - 動画${videoId}`)
    
    return res.json({
      success: true,
      data: savedLog,
      message: '視聴ログを保存しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}