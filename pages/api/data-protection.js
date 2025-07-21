// データ保護・バックアップシステム
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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
  
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    const { kv } = require('@vercel/kv')
    
    if (req.method === 'GET') {
      // データ整合性チェック
      console.log('データ整合性チェック開始...')
      
      const [usersData, groupsData, coursesData, videosData, logsData] = await Promise.all([
        kv.get('users'),
        kv.get('groups'), 
        kv.get('courses'),
        kv.get('videos'),
        kv.get('viewing_logs')
      ])
      
      const integrity = {
        users: {
          exists: !!usersData,
          count: usersData?.users ? Object.keys(usersData.users).length : 0,
          nextId: usersData?.nextUserId || 1,
          lastUpdated: usersData?.lastUpdated || null
        },
        groups: {
          exists: !!groupsData,
          count: groupsData?.groups ? Object.keys(groupsData.groups).length : 0,
          nextId: groupsData?.nextGroupId || 1,
          lastUpdated: groupsData?.lastUpdated || null
        },
        courses: {
          exists: !!coursesData,
          count: coursesData?.courses ? Object.keys(coursesData.courses).length : 0,
          nextId: coursesData?.nextCourseId || 1,
          curriculumCount: 0,
          lastUpdated: coursesData?.lastUpdated || null
        },
        videos: {
          exists: !!videosData,
          count: videosData?.videos ? Object.keys(videosData.videos).length : 0,
          nextId: videosData?.nextVideoId || 1,
          lastUpdated: videosData?.lastUpdated || null
        },
        logs: {
          exists: !!logsData,
          count: logsData?.logs ? Object.keys(logsData.logs).length : 0,
          nextId: logsData?.nextLogId || 1,
          lastUpdated: logsData?.lastUpdated || null
        }
      }
      
      // カリキュラム数を計算
      if (coursesData?.courses) {
        for (const courseId in coursesData.courses) {
          const course = coursesData.courses[courseId]
          if (course.curriculums) {
            integrity.courses.curriculumCount += course.curriculums.length
          }
        }
      }
      
      // バックアップタイムスタンプを記録
      const backupTimestamp = new Date().toISOString()
      await kv.set('last_integrity_check', {
        timestamp: backupTimestamp,
        integrity: integrity
      })
      
      console.log('データ整合性チェック完了:', integrity)
      
      return res.json({
        success: true,
        data: integrity,
        timestamp: backupTimestamp,
        message: 'データ整合性チェック完了'
      })
    }
    
    if (req.method === 'POST') {
      // 自動バックアップ・復旧システム
      const { action } = req.body
      
      if (action === 'backup') {
        console.log('完全データバックアップ開始...')
        
        const [usersData, groupsData, coursesData, videosData, logsData] = await Promise.all([
          kv.get('users'),
          kv.get('groups'), 
          kv.get('courses'),
          kv.get('videos'),
          kv.get('viewing_logs')
        ])
        
        const backupData = {
          users: usersData,
          groups: groupsData,
          courses: coursesData,
          videos: videosData,
          logs: logsData,
          backupTimestamp: new Date().toISOString(),
          version: '1.0'
        }
        
        // バックアップをKVに保存（日次ローテーション）
        const today = new Date().toISOString().split('T')[0]
        await kv.set(`backup_${today}`, backupData)
        
        console.log('完全データバックアップ完了')
        
        return res.json({
          success: true,
          message: `データバックアップ完了 - ${today}`,
          backupKey: `backup_${today}`,
          dataSize: JSON.stringify(backupData).length
        })
      }
      
      if (action === 'ensure_structure') {
        console.log('データ構造確保開始...')
        
        // 基本データ構造の確保
        const defaultStructures = {
          users: { users: {}, nextUserId: 1, lastUpdated: new Date().toISOString() },
          groups: { groups: {}, nextGroupId: 1, lastUpdated: new Date().toISOString() },
          courses: { courses: {}, nextCourseId: 1, lastUpdated: new Date().toISOString() },
          videos: { videos: {}, nextVideoId: 1, lastUpdated: new Date().toISOString() },
          viewing_logs: { logs: {}, nextLogId: 1, lastUpdated: new Date().toISOString() }
        }
        
        const ensured = {}
        
        for (const [key, defaultValue] of Object.entries(defaultStructures)) {
          const existing = await kv.get(key)
          if (!existing) {
            await kv.set(key, defaultValue)
            ensured[key] = 'created'
            console.log(`✅ ${key} 構造を作成`)
          } else {
            ensured[key] = 'exists'
          }
        }
        
        console.log('データ構造確保完了:', ensured)
        
        return res.json({
          success: true,
          data: ensured,
          message: 'データ構造確保完了'
        })
      }
      
      return res.status(400).json({
        success: false,
        message: '無効なアクション。backup または ensure_structure を指定してください。'
      })
    }
    
  } catch (error) {
    console.error('データ保護エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'データ保護処理に失敗しました',
      error: error.message
    })
  }
}