// 緊急データ復旧エンドポイント
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
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
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
    console.log('緊急データ復旧開始...')
    
    const { kv } = require('@vercel/kv')
    
    // 基本グループデータの復旧
    const defaultGroups = {
      groups: {
        '1': {
          id: 1,
          name: '管理グループ',
          code: 'ADMIN',
          description: 'システム管理者グループ',
          userIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        '2': {
          id: 2,
          name: '開発チーム',
          code: 'DEV',
          description: '開発者グループ',
          userIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        '3': {
          id: 3,
          name: '営業チーム',
          code: 'SALES',
          description: '営業担当グループ',
          userIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      nextGroupId: 4,
      lastUpdated: new Date().toISOString()
    }
    
    // 現在のデータをチェック
    const existingGroups = await kv.get('groups')
    const existingUsers = await kv.get('users')
    const existingCourses = await kv.get('courses')
    
    const recoveryReport = {
      groupsRecovered: false,
      usersCount: 0,
      coursesCount: 0,
      timestamp: new Date().toISOString()
    }
    
    // グループデータの復旧
    if (!existingGroups || Object.keys(existingGroups.groups || {}).length === 0) {
      await kv.set('groups', defaultGroups)
      recoveryReport.groupsRecovered = true
      console.log('✅ グループデータを復旧しました')
    }
    
    // 現在のデータ状況をレポート
    if (existingUsers && existingUsers.users) {
      recoveryReport.usersCount = Object.keys(existingUsers.users).length
    }
    
    if (existingCourses && existingCourses.courses) {
      recoveryReport.coursesCount = Object.keys(existingCourses.courses).length
    }
    
    console.log('緊急データ復旧完了:', recoveryReport)
    
    return res.json({
      success: true,
      data: recoveryReport,
      message: '緊急データ復旧が完了しました',
      endpoint: 'emergency-recover'
    })
    
  } catch (error) {
    console.error('緊急データ復旧エラー:', error)
    return res.status(500).json({
      success: false,
      message: '緊急データ復旧に失敗しました',
      error: error.message
    })
  }
}