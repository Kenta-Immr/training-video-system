// Course thumbnail upload endpoint

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
  
  // アップロード処理（デモ版では模擬的に処理）
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
    
    // デモ版では固定のサムネイルURLを返すが、ファイル内容に基づいて一意性を保つ
    const mockThumbnailUrls = [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop", 
      "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=300&fit=crop"
    ]
    
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
    
    // ファイル内容とファイル名の組み合わせで一意のハッシュを生成
    const fileHash = buffer.toString('base64').substring(0, 20)
    const hashInput = filename + fileHash + buffer.length
    const hashIndex = hashInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % mockThumbnailUrls.length
    
    // 一意性を保つためハッシュ値をパラメータに追加
    const uniqueId = Buffer.from(hashInput).toString('base64').substring(0, 8)
    const thumbnailUrl = mockThumbnailUrls[hashIndex] + '&demo_id=' + uniqueId
    
    console.log(`デモサムネイル生成: ${thumbnailUrl}`)
    
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