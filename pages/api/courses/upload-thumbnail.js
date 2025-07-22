// Course thumbnail upload endpoint
import fs from 'fs'
import path from 'path'

// Next.jsの自動bodyパースを無効化（ファイルアップロード用）
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '10mb',
  },
  maxDuration: 30,
}

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Filename')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'POSTメソッドのみサポートされています'
    })
  }
  
  // アップロード処理（実際のファイル保存）
  try {
    console.log('サムネイル画像のアップロード処理を開始')
    console.log('リクエストヘッダー:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'x-filename': req.headers['x-filename']
    })
    
    // リクエストサイズをチェック（5MB制限）
    const contentLength = req.headers['content-length']
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'ファイルサイズが大きすぎます（5MB以下にしてください）'
      })
    }
    
    // リクエストボディを消費
    const chunks = []
    
    for await (const chunk of req) {
      chunks.push(chunk)
    }
    
    const buffer = Buffer.concat(chunks)
    console.log('受信データサイズ:', buffer.length, 'バイト')
    
    let filename = 'thumbnail'
    
    try {
      // Base64エンコードされたファイル名をデコード
      const encodedFilename = req.headers['x-filename']
      if (encodedFilename) {
        filename = decodeURIComponent(Buffer.from(encodedFilename, 'base64').toString())
        console.log('デコードされたファイル名:', filename)
      }
    } catch (error) {
      console.warn('ファイル名のデコードに失敗:', error.message)
      // デフォルトのファイル名を使用
    }
    
    // ファイル拡張子の取得
    const fileExt = path.extname(filename) || '.jpg'
    
    // 一意のファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const uniqueFilename = `thumbnail_${timestamp}_${randomString}${fileExt}`
    
    // 保存ディレクトリの設定
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails')
    const filePath = path.join(uploadDir, uniqueFilename)
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log('アップロードディレクトリを作成:', uploadDir)
    }
    
    // ファイルを保存
    fs.writeFileSync(filePath, buffer)
    console.log('ファイル保存完了:', filePath)
    
    // 公開URLを生成
    const thumbnailUrl = `/uploads/thumbnails/${uniqueFilename}`
    
    console.log(`サムネイル保存完了: ${thumbnailUrl}`)
    
    return res.status(200).json({
      success: true,
      data: {
        thumbnailUrl: thumbnailUrl
      },
      message: 'サムネイル画像のアップロードが完了しました'
    })
    
  } catch (error) {
    console.error('サムネイルアップロードエラー詳細:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    })
    
    return res.status(500).json({
      success: false,
      message: `サムネイルアップロードエラー: ${error.message}`,
      error: {
        message: error.message,
        name: error.name,
        code: error.code
      },
      debug: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    })
  }
}