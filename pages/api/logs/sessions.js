// Session logging endpoint
const dataStore = require('../../../lib/dataStore')

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // 認証チェック（Authorizationヘッダーまたはトークンパラメータから取得）
  let token = null
  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // sendBeacon の場合、認証情報を別途取得する必要がある場合の対応
  if (!token && req.body && typeof req.body === 'string') {
    try {
      // sendBeacon でJSON文字列として送信された場合のパース
      const data = JSON.parse(req.body)
      req.body = data
    } catch (e) {
      // パースできない場合はそのまま続行
    }
  }
  
  if (!token) {
    // 認証なしでもログを記録するように変更（デモ用）
    console.log('認証なしセッションログ受信')
  }
  
  let userId = null
  if (token) {
    userId = parseInt(token.replace('demo-user-', '').replace('demo-admin-', ''))
  }
  
  if (req.method === 'POST') {
    const { videoId, startTime, endTime, sessionDuration, videoPosition } = req.body
    
    if (!videoId || !startTime || !endTime || sessionDuration === undefined) {
      return res.status(400).json({
        success: false,
        message: '必要なパラメータが不足しています'
      })
    }
    
    try {
      // セッションログを保存（現在はコンソール出力のみ）
      const sessionLog = {
        userId,
        videoId,
        startTime,
        endTime,
        sessionDuration,
        videoPosition,
        timestamp: new Date().toISOString()
      }
      
      console.log('視聴セッションログ保存:', sessionLog)
      
      // 今後、必要に応じてデータベースやファイルに保存可能
      // dataStore.saveSessionLog(sessionLog)
      
      return res.json({
        success: true,
        message: 'セッションログが保存されました',
        data: sessionLog
      })
      
    } catch (error) {
      console.error('セッションログ保存エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'セッションログの保存に失敗しました',
        error: error.message
      })
    }
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}