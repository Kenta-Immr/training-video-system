// Users management endpoint

// デモユーザーデータ
let usersData = [
  {
    id: 1,
    email: 'admin@test.com',
    name: '管理者ユーザー',
    role: 'ADMIN',
    groupId: 1,
    group: {
      id: 1,
      name: '管理グループ',
      code: 'ADMIN001'
    },
    isFirstLogin: false,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    email: 'user1@test.com',
    name: '開発者A',
    role: 'USER',
    groupId: 2,
    group: {
      id: 2,
      name: '開発チーム',
      code: 'DEV001'
    },
    isFirstLogin: false,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    email: 'user2@test.com',
    name: '開発者B',
    role: 'USER',
    groupId: 2,
    group: {
      id: 2,
      name: '開発チーム',
      code: 'DEV001'
    },
    isFirstLogin: true,
    lastLoginAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
]

let nextUserId = 4

// 共有データストア関数
function getUsersDataFromSharedStore() {
  if (global.usersData) {
    return global.usersData
  }
  global.usersData = usersData
  return global.usersData
}

function getNextUserId() {
  if (!global.nextUserId) {
    global.nextUserId = nextUserId
  }
  return ++global.nextUserId
}

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
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
  if (!token.startsWith('demo-admin')) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  // 共有データを取得
  const users = getUsersDataFromSharedStore()
  
  if (req.method === 'GET') {
    console.log(`ユーザー一覧取得: ${users.length}件`)
    
    return res.json({
      success: true,
      data: users
    })
  }
  
  if (req.method === 'POST') {
    const { email, name, role = 'USER', password, groupId } = req.body
    
    console.log('ユーザー作成リクエスト:', { email, name, role, groupId })
    
    // バリデーション
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'メールアドレスと名前は必須です'
      })
    }
    
    // メールアドレスの重複チェック
    if (users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      })
    }
    
    // グループ情報取得（簡単なマッピング）
    const groupMapping = {
      1: { id: 1, name: '管理グループ', code: 'ADMIN001' },
      2: { id: 2, name: '開発チーム', code: 'DEV001' },
      3: { id: 3, name: '営業チーム', code: 'SALES001' }
    }
    
    const newUser = {
      id: getNextUserId(),
      email,
      name,
      role: role.toUpperCase(),
      groupId: groupId || null,
      group: groupId && groupMapping[groupId] ? groupMapping[groupId] : null,
      isFirstLogin: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempPassword: password || generateTempPassword() // デモ用
    }
    
    users.push(newUser)
    
    console.log(`新規ユーザー作成: ${name} (${email}) - ID: ${newUser.id}`)
    
    return res.json({
      success: true,
      data: newUser,
      message: 'ユーザーを作成しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}