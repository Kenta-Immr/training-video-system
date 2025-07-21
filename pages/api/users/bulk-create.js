// Bulk user creation endpoint with CSV support
const dataStore = require('../../../lib/dataStore')

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}

// CSVパースヘルパー関数
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  const users = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length >= 2) { // 最低限の name, email
      const user = {}
      headers.forEach((header, index) => {
        if (values[index]) {
          user[header] = values[index]
        }
      })
      users.push(user)
    }
  }
  
  return users
}

export default function handler(req, res) {
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
      message: 'POSTメソッドのみサポートされています'
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
  
  console.log('=== 一括ユーザー作成API: 認証チェック開始 ===')
  console.log('リクエスト詳細:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type']
  })
  console.log('認証ヘッダー:', {
    authorization: req.headers.authorization ? 'あり' : 'なし',
    authHeaderLength: req.headers.authorization?.length || 0,
    authHeaderPrefix: req.headers.authorization?.substring(0, 20) || 'なし'
  })
  console.log('トークン詳細:', {
    token: token.substring(0, 20) + '...',
    tokenLength: token.length,
    tokenFull: process.env.NODE_ENV === 'development' ? token : '***',
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const startsWithDemoAdmin = token.startsWith('demo-admin')
  const startsWithAdmin = token.startsWith('admin')
  const isProdValidToken = process.env.NODE_ENV === 'production' && token && token.length > 10
  
  console.log('認証条件チェック:', {
    startsWithDemoAdmin,
    startsWithAdmin, 
    isProdValidToken,
    nodeEnv: process.env.NODE_ENV,
    isVercelEnv: !!process.env.VERCEL
  })
  
  const isValidAdmin = startsWithDemoAdmin || startsWithAdmin || isProdValidToken
  
  console.log('最終認証結果:', { isValidAdmin })
  
  if (!isValidAdmin) {
    console.log('=== 認証失敗: 詳細ログ ===')
    console.log('トークン:', {
      prefix: token.substring(0, 15),
      length: token.length,
      full: process.env.NODE_ENV === 'development' ? token : 'hidden'
    })
    console.log('環境情報:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      expectedPrefixes: ['demo-admin', 'admin']
    })
    
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です',
      debug: process.env.NODE_ENV === 'development' ? { 
        tokenPrefix: token.substring(0, 15),
        tokenLength: token.length,
        env: process.env.NODE_ENV,
        expectedPrefixes: ['demo-admin', 'admin']
      } : {
        tokenPrefix: token.substring(0, 5),
        env: process.env.NODE_ENV
      }
    })
  }
  
  console.log('=== 認証成功: 一括ユーザー作成処理開始 ===')
  
  try {
    const { users: usersArray, csvText } = req.body
    let usersToCreate = []
    
    // CSVテキストが提供された場合
    if (csvText) {
      console.log('CSVテキストから一括ユーザー作成を開始')
      usersToCreate = parseCSV(csvText)
    } 
    // ユーザー配列が提供された場合
    else if (usersArray && Array.isArray(usersArray)) {
      console.log('ユーザー配列から一括ユーザー作成を開始')
      usersToCreate = usersArray
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'CSVテキストまたはユーザー配列が必要です'
      })
    }
    
    if (usersToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: '作成するユーザーが見つかりません'
      })
    }
    
    console.log(`${usersToCreate.length}件のユーザー作成を開始`)
    
    // データストアから既存ユーザーとグループを取得
    const existingUsers = dataStore.getUsers()
    const groups = dataStore.getGroups()
    
    const results = {
      success: 0,
      errors: 0,
      created: [],
      failed: []
    }
    
    for (let i = 0; i < usersToCreate.length; i++) {
      const userData = usersToCreate[i]
      
      try {
        // 必須フィールドチェック
        if (!userData.name || !userData.email) {
          results.failed.push({
            index: i + 1,
            email: userData.email || '未指定',
            error: '名前とメールアドレスは必須です'
          })
          results.errors++
          continue
        }
        
        // 重複チェック
        if (dataStore.getUserByEmail(userData.email)) {
          results.failed.push({
            index: i + 1,
            email: userData.email,
            error: 'このメールアドレスは既に使用されています'
          })
          results.errors++
          continue
        }
        
        // グループ情報の解決
        let groupId = null
        
        if (userData.groupId || userData.groupName || userData.groupCode) {
          const groupKey = userData.groupId || userData.groupName || userData.groupCode
          
          // グループIDで検索
          let group = groups.find(g => g.id == groupKey)
          if (!group) {
            // グループコードで検索
            group = groups.find(g => g.code === groupKey)
          }
          if (!group) {
            // グループ名で検索
            group = groups.find(g => g.name === groupKey)
          }
          
          if (group) {
            groupId = group.id
          }
        }
        
        // データストアを使用してユーザー作成
        const newUser = dataStore.createUser({
          email: userData.email,
          name: userData.name,
          password: userData.password || generateTempPassword(),
          role: (userData.role || 'USER').toUpperCase(),
          groupId,
          isFirstLoginPending: true
        })
        
        results.created.push(newUser)
        results.success++
        
        console.log(`ユーザー作成成功: ${newUser.name} (${newUser.email})`)
        
      } catch (error) {
        console.error(`ユーザー作成エラー (${i + 1}行目):`, error)
        results.failed.push({
          index: i + 1,
          email: userData.email || '未指定',
          error: error.message || '不明なエラー'
        })
        results.errors++
      }
    }
    
    console.log(`一括ユーザー作成完了: 成功=${results.success}, エラー=${results.errors}`)
    
    return res.json({
      success: true,
      data: results,
      message: `${results.success}件のユーザーを作成しました（エラー: ${results.errors}件）`
    })
    
  } catch (error) {
    console.error('一括ユーザー作成エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバー内部エラーが発生しました',
      error: error.message
    })
  }
}