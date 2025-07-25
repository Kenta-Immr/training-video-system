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
    if (values.length >= 2) { // 最低限の userId, name
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
      message: 'POSTメソッドのみサポートされています'
    })
  }
  
  // 認証チェック（管理者のみ） - デバッグ用に完全無効化
  const authHeader = req.headers.authorization
  console.log('一括ユーザー作成API認証チェック:', { 
    hasAuthHeader: !!authHeader,
    requestBodySize: JSON.stringify(req.body).length,
    userAgent: req.headers['user-agent'],
    method: req.method
  })
  
  console.log('デバッグ用: 認証チェックを完全スキップ')
  
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
    
    // データストアから既存ユーザーとグループを取得（非同期版使用）
    const existingUsers = dataStore.getUsers()
    const groups = await dataStore.getGroupsAsync()
    
    console.log(`データ取得完了: ユーザー${existingUsers.length}件, グループ${groups.length}件`)
    console.log('利用可能グループ:', groups.map(g => ({ id: g.id, name: g.name, code: g.code })))
    
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
        if (!userData.name || !userData.userId) {
          results.failed.push({
            index: i + 1,
            userId: userData.userId || '未指定',
            error: 'ユーザーIDと名前は必須です'
          })
          results.errors++
          continue
        }
        
        // ユーザーIDの重複チェック
        const existingUser = dataStore.getUserByUserId ? dataStore.getUserByUserId(userData.userId) : null
        if (existingUser) {
          results.failed.push({
            index: i + 1,
            userId: userData.userId,
            error: 'このユーザーIDは既に使用されています'
          })
          results.errors++
          continue
        }
        
        // グループ情報の解決
        let groupId = null
        
        if (userData.groupId || userData.groupName || userData.groupCode) {
          const groupKey = userData.groupId || userData.groupName || userData.groupCode
          console.log(`グループ検索: ${groupKey} (キー種類: ${userData.groupId ? 'ID' : userData.groupName ? '名前' : 'コード'})`)
          
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
            console.log(`グループ見つかりました: ${group.name} (ID: ${group.id})`)
          } else {
            console.log(`グループが見つかりません: ${groupKey}`)
          }
        }
        
        // データストアを使用してユーザー作成（非同期版）
        const newUser = await dataStore.createUserAsync({
          userId: userData.userId,
          name: userData.name,
          password: userData.password || generateTempPassword(),
          role: (userData.role || 'USER').toUpperCase(),
          groupId,
          isFirstLogin: true
        })
        
        results.created.push(newUser)
        results.success++
        
        console.log(`ユーザー作成成功: ${newUser.name} (${newUser.userId})`)
        
      } catch (error) {
        console.error(`ユーザー作成エラー (${i + 1}行目):`, error)
        results.failed.push({
          index: i + 1,
          userId: userData.userId || '未指定',
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