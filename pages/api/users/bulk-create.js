// Bulk user creation endpoint
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'POST') {
    const { users } = req.body
    
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid users data'
      })
    }
    
    // 一括ユーザー作成を模擬
    const created = []
    const failed = []
    
    users.forEach((user, index) => {
      try {
        // バリデーション
        if (!user.email || !user.name || !user.password) {
          failed.push({
            index,
            email: user.email || '',
            error: 'メールアドレス、名前、パスワードは必須です'
          })
          return
        }
        
        // メール形式チェック
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
          failed.push({
            index,
            email: user.email,
            error: 'メールアドレスの形式が正しくありません'
          })
          return
        }
        
        // 成功として追加
        created.push({
          id: Date.now() + index,
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          groupId: user.groupId || null,
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      } catch (error) {
        failed.push({
          index,
          email: user.email || '',
          error: 'ユーザー作成でエラーが発生しました'
        })
      }
    })
    
    return res.json({
      success: true,
      data: {
        success: created.length,
        errors: failed.length,
        created,
        failed
      }
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}