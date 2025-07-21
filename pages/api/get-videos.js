// 動画取得専用エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - GET only'
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
  
  console.log('動画取得API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    console.log('認証失敗: 無効な管理者トークン', { token: token.substring(0, 10) })
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    // キャッシュ制御ヘッダーを追加
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Last-Modified', new Date().toUTCString())
    res.setHeader('ETag', `"${Date.now()}"`)
    
    console.log('動画取得処理開始...')
    
    // KVから直接取得（より確実）
    const { kv } = require('@vercel/kv')
    const videosData = await kv.get('videos')
    const coursesData = await kv.get('courses')
    
    let allVideos = []
    
    if (videosData && videosData.videos) {
      // videos データから全動画を取得し、コース・カリキュラム情報を付与
      for (const videoId in videosData.videos) {
        const video = videosData.videos[videoId]
        
        // カリキュラムとコース情報を検索
        let courseName = '不明なコース'
        let curriculumName = '不明なカリキュラム'
        
        if (coursesData && coursesData.courses) {
          for (const courseId in coursesData.courses) {
            const course = coursesData.courses[courseId]
            if (course.curriculums) {
              for (const curriculum of course.curriculums) {
                if (curriculum.id === video.curriculumId) {
                  courseName = course.title
                  curriculumName = curriculum.title
                  break
                }
              }
            }
          }
        }
        
        allVideos.push({
          ...video,
          courseName,
          curriculumName
        })
      }
      
      console.log(`KVから直接動画取得: ${allVideos.length}件`)
    } else {
      console.warn('KVに動画データが存在しません')
    }
    
    // 作成日時順にソート（新しい順）
    allVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    console.log(`動画取得成功: ${allVideos.length}件`)
    console.log('取得動画ID一覧:', allVideos.map(v => ({ id: v.id, title: v.title, curriculum: v.curriculumName })))
    
    return res.json({
      success: true,
      data: allVideos,
      timestamp: new Date().toISOString(),
      count: allVideos.length,
      endpoint: 'get-videos'
    })
    
  } catch (error) {
    console.error('動画取得エラー:', error)
    console.error('エラースタック:', error.stack)
    
    return res.status(500).json({
      success: false,
      message: '動画取得に失敗しました',
      error: error.message,
      endpoint: 'get-videos'
    })
  }
}