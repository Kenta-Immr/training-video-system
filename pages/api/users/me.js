// User profile endpoint
const dataStore = require('../../../lib/dataStore')

// デモユーザー用トークンマッピング（本番ではJWTを使用）
const demoTokenToUser = {
  'demo-admin': { userId: 'admin' },
  'demo-user': { userId: 'user1' }
}

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      })
    }
    
    const token = authHeader.substring(7) // "Bearer " を除去
    
    try {
      // デモトークンチェック（後方互換性）
      if (token.startsWith('demo-')) {
        const tokenUser = demoTokenToUser[token]
        if (tokenUser && dataStore.getUserByUserId) {
          // データストアから実際のユーザー情報を取得
          const user = dataStore.getUserByUserId(tokenUser.userId)
          if (user) {
            // グループ情報を付与
            let group = null
            if (user.groupId && dataStore.getGroupById) {
              try {
                group = dataStore.getGroupById(user.groupId)
              } catch (groupError) {
                console.warn(`グループ取得エラー: ${groupError.message}`)
              }
            }
            
            const userWithGroup = {
              ...user,
              group
            }
            
            console.log(`デモユーザー情報取得: ${user.name} (${user.userId})`)
            return res.json({
              success: true,
              data: userWithGroup
            })
          }
        }
      }
      
      // 実際のユーザートークンの処理
      console.log('実際のユーザートークンを処理中:', token.substring(0, 10) + '...')
      
      // 全ユーザーを取得してトークンマッチング
      let users = []
      if (dataStore.getUsers) {
        try {
          users = dataStore.getUsers()
        } catch (getUsersError) {
          console.error('ユーザー一覧取得エラー:', getUsersError.message)
          return res.status(500).json({
            success: false,
            message: 'ユーザー情報の取得に失敗しました'
          })
        }
      }
      
      // トークンからユーザーを特定（簡易的な実装）
      let currentUser = null
      
      // adminトークンパターン
      if (token.startsWith('admin')) {
        currentUser = users.find(u => u.role === 'ADMIN')
        console.log('管理者トークンでユーザー検索:', currentUser ? currentUser.userId : 'なし')
      }
      
      // ユーザーIDベースのトークンパターン（user-{id}）
      if (!currentUser && token.startsWith('user-')) {
        const userId = parseInt(token.replace('user-', ''))
        currentUser = users.find(u => u.id === userId)
        console.log(`ユーザーID ${userId} でユーザー検索:`, currentUser ? currentUser.userId : 'なし')
      }
      
      // ユーザーIDベースのトークンパターン（token-{id}）
      if (!currentUser && token.startsWith('token-')) {
        const userId = parseInt(token.replace('token-', ''))
        currentUser = users.find(u => u.id === userId)
        console.log(`トークンID ${userId} でユーザー検索:`, currentUser ? currentUser.userId : 'なし')
      }
      
      // 全ユーザーのトークンと照合（フォールバック）
      if (!currentUser) {
        currentUser = users.find(u => u.password && token.includes(u.userId))
        console.log('ユーザーIDマッチング:', currentUser ? currentUser.userId : 'なし')
      }
      
      if (currentUser) {
        // グループ情報を付与
        let group = null
        if (currentUser.groupId) {
          try {
            group = dataStore.getGroupById(currentUser.groupId)
          } catch (groupError) {
            console.warn(`グループ取得エラー (ID: ${currentUser.groupId}):`, groupError.message)
          }
        }
        
        const userWithGroup = {
          ...currentUser,
          group
        }
        
        console.log(`ユーザー情報取得成功: ${currentUser.name} (${currentUser.userId})`)
        return res.json({
          success: true,
          data: userWithGroup
        })
      }
      
      console.log('トークンに一致するユーザーが見つかりません')
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'サーバーエラーが発生しました'
      })
    }
    
    return res.status(401).json({
      success: false,
      message: '無効なトークンです'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}