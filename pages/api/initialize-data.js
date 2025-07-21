// KVデータベースの初期化
const { kv } = require('@vercel/kv')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed - POST only' })
  }

  // 認証チェック
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
    console.log('KVデータベース初期化開始...')

    // 初期ユーザーデータ
    const initialUsers = {
      users: {
        '1': {
          id: 1,
          email: 'admin@company.com',
          name: 'システム管理者',
          password: '$2b$10$hashedPasswordHere', // ダミーハッシュ
          role: 'ADMIN',
          groupId: null,
          isFirstLogin: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      nextUserId: 2,
      lastUpdated: new Date().toISOString()
    }

    // 初期グループデータ
    const initialGroups = {
      groups: {
        '1': {
          id: 1,
          name: '管理グループ',
          code: 'ADMIN-GROUP',
          description: 'システム管理者用グループ',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      nextGroupId: 2,
      lastUpdated: new Date().toISOString()
    }

    // 初期コースデータ
    const initialCourses = {
      courses: {},
      nextCourseId: 1,
      lastUpdated: new Date().toISOString()
    }

    // KVに保存
    await Promise.all([
      kv.set('users', initialUsers),
      kv.set('groups', initialGroups), 
      kv.set('courses', initialCourses)
    ])

    console.log('KV初期化完了')

    // 確認のため読み戻し
    const [savedUsers, savedGroups, savedCourses] = await Promise.all([
      kv.get('users'),
      kv.get('groups'),
      kv.get('courses')
    ])

    return res.json({
      success: true,
      message: 'KVデータベースを初期化しました',
      initialized: {
        users: {
          count: Object.keys(savedUsers?.users || {}).length,
          nextId: savedUsers?.nextUserId
        },
        groups: {
          count: Object.keys(savedGroups?.groups || {}).length,
          nextId: savedGroups?.nextGroupId
        },
        courses: {
          count: Object.keys(savedCourses?.courses || {}).length,
          nextId: savedCourses?.nextCourseId
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('KV初期化エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'KV初期化に失敗しました',
      error: error.message
    })
  }
}