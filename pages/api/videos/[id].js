// Individual video management endpoint
const dataStore = require('../../../lib/dataStore')

export default function handler(req, res) {
  const { id } = req.query
  const videoId = parseInt(id)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
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
    const video = dataStore.getVideoById(videoId)
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '動画が見つかりません'
      })
    }
    
    console.log(`動画取得: ${video.title} (ID: ${videoId})`)
    
    return res.json({
      success: true,
      data: video
    })
  }
  
  if (req.method === 'PUT') {
    const { title, description, videoUrl } = req.body
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'タイトルは必須です'
      })
    }
    
    const updatedVideo = dataStore.updateVideo(videoId, {
      title,
      description: description || '',
      videoUrl: videoUrl || ''
    })
    
    if (!updatedVideo) {
      return res.status(404).json({
        success: false,
        message: '動画が見つかりません'
      })
    }
    
    console.log(`動画更新: ${title} (ID: ${videoId})`)
    
    return res.json({
      success: true,
      data: updatedVideo,
      message: '動画情報を更新しました'
    })
  }
  
  if (req.method === 'DELETE') {
    const deleted = dataStore.deleteVideo(videoId)
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '動画が見つかりません'
      })
    }
    
    console.log(`動画削除: (ID: ${videoId})`)
    
    return res.json({
      success: true,
      message: '動画を削除しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}