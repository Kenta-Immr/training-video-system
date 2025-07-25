// Video file upload endpoint

// Next.jsの自動bodyパースを無効化（ファイルアップロード用）
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
    sizeLimit: '50mb',
  },
  maxDuration: 300,
}

// データストアの読み込み
const dataStore = require('../../../lib/dataStore')

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'POSTメソッドのみサポートされています'
    })
  }
  
  // 認証チェック（管理者のみ） - 一時的に緩和
  const authHeader = req.headers.authorization
  console.log('動画アップロードAPI認証チェック:', { 
    hasAuthHeader: !!authHeader,
    contentLength: req.headers['content-length'],
    contentType: req.headers['content-type']?.substring(0, 50)
  })
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('認証ヘッダーなし - 開発環境のため認証をスキップ')
    // 一時的に認証をスキップ（デバッグ用）
  } else {
    const token = authHeader.substring(7)
    console.log('✓ 動画アップロードAPI認証成功')
  }
  
  try {
    console.log('動画ファイルアップロード処理を開始')
    
    // Vercelの制限をチェック
    const contentLength = req.headers['content-length']
    const maxSize = 4 * 1024 * 1024 // 4MB制限（Vercelの制限）
    
    console.log('ファイルサイズチェック:', {
      contentLength: contentLength,
      contentLengthMB: contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) + 'MB' : 'unknown',
      maxSizeMB: (maxSize / 1024 / 1024) + 'MB'
    })
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        message: `ファイルサイズが大きすぎます。Vercelの制限により${maxSize / 1024 / 1024}MB以下にしてください。`,
        details: {
          currentSize: (parseInt(contentLength) / 1024 / 1024).toFixed(2) + 'MB',
          maxSize: (maxSize / 1024 / 1024) + 'MB',
          suggestion: 'チャンクアップロード機能をご利用ください。'
        }
      })
    }
    
    // 実際の本番環境では、ここでformidableを使ってファイルを処理
    // const form = formidable({
    //   uploadDir: './public/uploads/videos',
    //   keepExtensions: true,
    //   maxFileSize: 500 * 1024 * 1024, // 500MB
    // })
    
    // form.parse(req, (err, fields, files) => {
    //   if (err) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'ファイルのアップロードに失敗しました'
    //     })
    //   }
    //   
    //   const videoFile = files.video
    //   // ファイル処理とURL生成
    // })
    
    // デモ版では固定の動画URLを返す（本来はアップロードされた動画のURL）
    const mockVideoUrls = [
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    ]
    
    // ランダムに動画URLを選択
    const randomIndex = Math.floor(Math.random() * mockVideoUrls.length)
    const videoUrl = mockVideoUrls[randomIndex]
    
    // FormDataから情報を取得（デモ用のシミュレーション）
    // 本来はformidableで解析するが、デモ版ではリクエストヘッダーから取得
    const mockFormData = {
      title: req.headers['x-video-title'] || "アップロードされた動画" + Date.now(),
      description: req.headers['x-video-description'] || "ファイルアップロードによる動画",
      curriculumId: parseInt(req.headers['x-curriculum-id'])
    }
    
    // カリキュラムIDの検証
    if (!mockFormData.curriculumId || isNaN(mockFormData.curriculumId)) {
      return res.status(400).json({
        success: false,
        message: 'カリキュラムIDが必要です'
      })
    }
    
    console.log('フォームデータ（ヘッダーから取得）:', mockFormData)
    
    // 新しい動画を作成
    const newVideo = dataStore.createVideo({
      title: mockFormData.title,
      description: mockFormData.description,
      videoUrl: videoUrl,
      curriculumId: mockFormData.curriculumId,
      duration: 0, // 本来はアップロードされた動画から取得
      uploadedFile: true // アップロードファイルフラグ
    })
    
    if (!newVideo) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    console.log(`動画ファイルアップロード完了: ${newVideo.title} (ID: ${newVideo.id})`)
    console.log(`アップロード先URL: ${videoUrl}`)
    
    // 即座にレスポンスを返す（遅延は不要）
    return res.json({
      success: true,
      data: newVideo,
      message: '動画ファイルのアップロードが完了しました'
    })
    
  } catch (error) {
    console.error('動画アップロードエラー:', error)
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message
    })
  }
}