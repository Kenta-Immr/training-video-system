// Video file upload endpoint

// Next.jsの自動bodyパースを無効化（ファイルアップロード用）
export const config = {
  api: {
    bodyParser: false,
  },
}

// 共有データストア関数
function getCourseDataFromSharedStore() {
  if (global.courseData) {
    return global.courseData
  }
  // デフォルトデータ
  global.courseData = {
    1: {
      id: 1,
      title: "ウェブ開発入門",
      description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      curriculums: [
        {
          id: 1,
          title: "HTML基礎",
          description: "HTMLの基本構文と要素",
          courseId: 1,
          videos: []
        }
      ]
    }
  }
  return global.courseData
}

function getNextVideoId() {
  if (!global.nextVideoId) {
    global.nextVideoId = 100
  }
  return ++global.nextVideoId
}

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
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB制限
      return res.status(413).json({
        success: false,
        message: 'ファイルサイズが大きすぎます（50MB以下にしてください）'
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
    
    const courseDataStore = getCourseDataFromSharedStore()
    
    // FormDataから情報を取得（デモ用のシミュレーション）
    const mockFormData = {
      title: "アップロードされた動画" + Date.now(),
      description: "ファイルアップロードによる動画",
      curriculumId: 1 // デフォルト値、実際はフォームから取得
    }
    
    // カリキュラムを検索
    let curriculum = null
    let course = null
    
    for (const courseId in courseDataStore) {
      const courseData = courseDataStore[courseId]
      if (courseData.curriculums) {
        const foundCurriculum = courseData.curriculums.find(c => c.id === mockFormData.curriculumId)
        if (foundCurriculum) {
          curriculum = foundCurriculum
          course = courseData
          break
        }
      }
    }
    
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'カリキュラムが見つかりません'
      })
    }
    
    // 新しい動画を作成
    const newVideo = {
      id: getNextVideoId(),
      title: mockFormData.title,
      description: mockFormData.description,
      videoUrl: videoUrl,
      curriculumId: mockFormData.curriculumId,
      duration: 0, // 本来はアップロードされた動画から取得
      uploadedFile: true, // アップロードファイルフラグ
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // カリキュラムに動画を追加
    if (!curriculum.videos) {
      curriculum.videos = []
    }
    curriculum.videos.push(newVideo)
    
    console.log(`動画ファイルアップロード完了: ${newVideo.title} (ID: ${newVideo.id})`)
    console.log(`アップロード先URL: ${videoUrl}`)
    
    // アップロード感を演出するため少し遅延
    setTimeout(() => {
      res.json({
        success: true,
        data: newVideo,
        message: '動画ファイルのアップロードが完了しました'
      })
    }, 2000) // 2秒の遅延
    
  } catch (error) {
    console.error('動画アップロードエラー:', error)
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message
    })
  }
}