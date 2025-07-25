// Chunked video file upload endpoint for large files

const dataStore = require('../../../lib/dataStore')

export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
    sizeLimit: '50mb',
  },
  maxDuration: 300,
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Chunk-Index, X-Total-Chunks, X-Video-Title, X-Video-Description, X-Curriculum-Id')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'POSTメソッドのみサポートされています'
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
  if (!token.startsWith('demo-admin')) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    console.log('チャンク動画アップロード処理を開始')
    
    // チャンク情報の取得
    const chunkIndex = parseInt(req.headers['x-chunk-index']) || 0
    const totalChunks = parseInt(req.headers['x-total-chunks']) || 1
    const title = req.headers['x-video-title'] || 'アップロード動画'
    const description = req.headers['x-video-description'] || ''
    const curriculumId = parseInt(req.headers['x-curriculum-id'])
    
    console.log(`チャンク ${chunkIndex + 1}/${totalChunks} を処理中`)
    
    // 最終チャンクの場合のみ動画を作成
    if (chunkIndex === totalChunks - 1) {
      console.log('最終チャンク - 動画を作成します')
      
      // デモ版では固定URLを返す
      const mockVideoUrls = [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      ]
      
      const randomIndex = Math.floor(Math.random() * mockVideoUrls.length)
      const videoUrl = mockVideoUrls[randomIndex]
      
      // 新しい動画を作成
      const newVideo = dataStore.createVideo({
        title,
        description,
        videoUrl,
        curriculumId,
        duration: 0,
        uploadedFile: true
      })
      
      if (!newVideo) {
        return res.status(404).json({
          success: false,
          message: 'カリキュラムが見つかりません'
        })
      }
      
      console.log(`チャンクアップロード完了: ${newVideo.title} (ID: ${newVideo.id})`)
      
      return res.json({
        success: true,
        data: newVideo,
        message: 'チャンクアップロードが完了しました',
        finalChunk: true
      })
    } else {
      // 中間チャンクの場合
      console.log(`中間チャンク ${chunkIndex + 1}/${totalChunks} を受信`)
      
      return res.json({
        success: true,
        message: `チャンク ${chunkIndex + 1}/${totalChunks} を受信しました`,
        chunkIndex,
        totalChunks,
        finalChunk: false
      })
    }
    
  } catch (error) {
    console.error('チャンクアップロードエラー:', error)
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message
    })
  }
}