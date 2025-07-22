// Video file upload endpoint

// Next.jsの自動bodyパースを無効化（ファイルアップロード用）
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '1gb',
    sizeLimit: '1gb',
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
    console.log('動画ファイルアップロード処理を開始')
    
    // リクエストサイズをチェック
    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength) > 1024 * 1024 * 1024) { // 1GB制限
      return res.status(413).json({
        success: false,
        message: 'ファイルサイズが大きすぎます（1GB以下にしてください）'
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