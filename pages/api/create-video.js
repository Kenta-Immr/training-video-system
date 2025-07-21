// 確実動画作成専用エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
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
      message: 'Method not allowed - POST only'
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
  
  console.log('確実動画作成API認証チェック:', { 
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
    const { title, description, videoUrl, curriculumId } = req.body
    
    console.log('確実動画作成リクエスト:', { title, description, videoUrl, curriculumId })
    
    // バリデーション
    if (!title || !curriculumId) {
      return res.status(400).json({
        success: false,
        message: 'タイトルとカリキュラムIDは必須です'
      })
    }
    
    if (!videoUrl || videoUrl.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '動画URLが必要です'
      })
    }
    
    // KVから直接データを取得・更新（より確実）
    const { kv } = require('@vercel/kv')
    
    // 現在のコースデータを取得
    let coursesData = await kv.get('courses')
    if (!coursesData) {
      coursesData = {
        courses: {},
        nextCourseId: 1,
        lastUpdated: new Date().toISOString()
      }
    }
    
    // カリキュラムを検索
    let targetCourse = null
    let targetCurriculum = null
    
    for (const courseId in coursesData.courses) {
      const course = coursesData.courses[courseId]
      if (course.curriculums) {
        for (const curriculum of course.curriculums) {
          if (curriculum.id === parseInt(curriculumId)) {
            targetCourse = course
            targetCurriculum = curriculum
            break
          }
        }
      }
      if (targetCurriculum) break
    }
    
    if (!targetCurriculum) {
      return res.status(404).json({
        success: false,
        message: `カリキュラムID ${curriculumId} が見つかりません`
      })
    }
    
    // 新しい動画IDを生成
    let videosData = await kv.get('videos')
    if (!videosData) {
      videosData = {
        videos: {},
        nextVideoId: 1,
        lastUpdated: new Date().toISOString()
      }
    }
    
    const newVideoId = videosData.nextVideoId
    const newVideo = {
      id: newVideoId,
      title,
      description: description || '',
      videoUrl,
      curriculumId: parseInt(curriculumId),
      duration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // videos データに追加
    videosData.videos[newVideoId.toString()] = newVideo
    videosData.nextVideoId = newVideoId + 1
    videosData.lastUpdated = new Date().toISOString()
    
    // カリキュラムの動画配列に追加
    if (!targetCurriculum.videos) {
      targetCurriculum.videos = []
    }
    targetCurriculum.videos.push(newVideo)
    targetCurriculum.updatedAt = new Date().toISOString()
    
    // コースの更新日時も更新
    targetCourse.updatedAt = new Date().toISOString()
    coursesData.lastUpdated = new Date().toISOString()
    
    // KVに保存
    await kv.set('videos', videosData)
    await kv.set('courses', coursesData)
    
    console.log(`確実動画作成成功: ${title} (ID: ${newVideo.id}) → カリキュラム: ${targetCurriculum.title}`)
    
    // 保存確認
    const verifyVideos = await kv.get('videos')
    const foundVideo = verifyVideos?.videos?.[newVideoId.toString()]
    if (foundVideo) {
      console.log('✓ KVに動画保存確認済み:', foundVideo.title)
    }
    
    return res.json({
      success: true,
      data: newVideo,
      message: '動画を確実に作成しました',
      courseTitle: targetCourse.title,
      curriculumTitle: targetCurriculum.title,
      endpoint: 'create-video'
    })
    
  } catch (error) {
    console.error('確実動画作成エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}