// Course thumbnail upload endpoint
// import formidable from 'formidable'
// import fs from 'fs'
// import path from 'path'

// Next.jsの自動bodyパースを無効化（ファイルアップロード用）
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
  maxDuration: 30,
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
  
  // アップロード処理（デモ版では模擬的に処理）
  try {
    console.log('サムネイル画像のアップロード処理を開始')
    
    // 実際の本番環境では、ここでformidableを使ってファイルを処理
    // const form = formidable({
    //   uploadDir: './public/uploads',
    //   keepExtensions: true,
    //   maxFileSize: 10 * 1024 * 1024, // 10MB
    // })
    
    // form.parse(req, (err, fields, files) => {
    //   if (err) {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'ファイルのアップロードに失敗しました'
    //     })
    //   }
    //   
    //   const file = files.thumbnail
    //   // ファイル処理とURL生成
    // })
    
    // デモ版では固定のサムネイルURLを返す
    const mockThumbnailUrls = [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop"
    ]
    
    // ランダムにサムネイルを選択
    const randomIndex = Math.floor(Math.random() * mockThumbnailUrls.length)
    const thumbnailUrl = mockThumbnailUrls[randomIndex]
    
    console.log(`デモサムネイル生成: ${thumbnailUrl}`)
    
    // 即座にレスポンスを返す（遅延は不要）
    return res.json({
      success: true,
      data: {
        thumbnailUrl: thumbnailUrl
      },
      message: 'サムネイル画像のアップロードが完了しました'
    })
    
  } catch (error) {
    console.error('サムネイルアップロードエラー:', error)
    res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message
    })
  }
}