// Instructors management endpoint
const dataStore = require('../../lib/dataStore')

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
  
  if (req.method === 'GET') {
    const instructors = dataStore.getInstructors()
    
    console.log(`講師一覧取得: ${instructors.length}件`)
    
    return res.json({
      success: true,
      data: instructors
    })
  }
  
  if (req.method === 'POST') {
    const { name, email, bio, expertise, avatarUrl } = req.body
    
    console.log('講師作成リクエスト:', { name, email, bio, expertise })
    
    // バリデーション
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: '名前とメールアドレスは必須です'
      })
    }
    
    // メールアドレスの重複チェック
    const existingInstructor = dataStore.getInstructorByEmail(email)
    if (existingInstructor) {
      return res.status(400).json({
        success: false,
        message: 'このメールアドレスは既に使用されています'
      })
    }
    
    const newInstructor = dataStore.createInstructor({
      name,
      email,
      bio: bio || '',
      expertise: expertise || [],
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    })
    
    console.log(`新規講師作成: ${name} (${email}) - ID: ${newInstructor.id}`)
    
    return res.json({
      success: true,
      data: newInstructor,
      message: '講師を作成しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}