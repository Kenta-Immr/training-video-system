// Courses endpoint
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  console.log(`API呼び出し: ${req.method} /api/courses`)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - CORS preflight')
    return res.status(200).end()
  }
  
  // 認証チェック（POST以外のGETは公開）
  if (req.method !== 'GET') {
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
  }

  if (req.method === 'GET') {
    try {
      console.log('コース一覧取得API開始')
      
      // キャッシュ制御ヘッダーを追加
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
      res.setHeader('Last-Modified', new Date().toUTCString())
      res.setHeader('ETag', `"${Date.now()}"`)
      
      // コース一覧を取得（非同期対応）
      const courseList = await dataStore.getCoursesAsync()
      console.log(`コース一覧取得: ${courseList.length}件`)
      console.log('取得したコースリスト:', courseList.map(c => ({ id: c.id, title: c.title })))
      
      return res.json({
        success: true,
        data: courseList,
        timestamp: new Date().toISOString(),
        count: courseList.length
      })
    } catch (error) {
      console.error('コース一覧取得エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'コース一覧の取得に失敗しました',
        error: error.message
      })
    }
  }

  if (req.method === 'POST') {
    try {
      // 新規コース作成
      const { title, description, thumbnailUrl } = req.body
      
      console.log('新規コース作成リクエスト:', { 
        title, 
        description, 
        thumbnailUrl,
        headers: req.headers,
        body: req.body 
      })
      
      if (!title || title.trim() === '') {
        console.log('エラー: コースタイトルが空です')
        return res.status(400).json({
          success: false,
          message: 'コースタイトルは必須です'
        })
      }

      const newCourse = dataStore.createCourse({
        title: title.trim(),
        description: description ? description.trim() : '',
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
      })
      
      if (!newCourse) {
        console.log('エラー: コース作成に失敗しました')
        return res.status(500).json({
          success: false,
          message: 'コースの作成に失敗しました'
        })
      }
      
      console.log(`新規コース作成完了: ${title} (ID: ${newCourse.id})`)

      return res.json({
        success: true,
        data: newCourse,
        message: 'コースを作成しました'
      })
    } catch (error) {
      console.error('コース作成エラー詳細:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      })
      return res.status(500).json({
        success: false,
        message: `サーバー内部エラー: ${error.message}`,
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

  console.log(`サポートされていないメソッド: ${req.method}`)
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed. Supported methods: GET, POST, OPTIONS`
  })
}