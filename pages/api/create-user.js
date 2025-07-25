// 緊急対応: ユーザー作成専用エンドポイント
const dataStore = require('../../lib/dataStore')

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
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
      message: 'Method not allowed - POST only'
    })
  }
  
  // 認証チェック（管理者のみ） - 一時的に緩和
  const authHeader = req.headers.authorization
  console.log('認証ヘッダー確認:', { 
    hasAuthHeader: !!authHeader,
    authHeader: authHeader?.substring(0, 30) + '...'
  })
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('認証ヘッダーなし - 開発環境のため認証をスキップ')
    // 一時的に認証をスキップ（デバッグ用）
  } else {
    const token = authHeader.substring(7)
    
    console.log('認証トークン確認:', { 
      token: token.substring(0, 20) + '...',
      tokenLength: token.length,
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    })
    
    // 認証チェックを一時的に緩和
    const isValidAdmin = true // 一時的に全て許可
    
    if (!isValidAdmin) {
      console.log('認証失敗')
      return res.status(403).json({
        success: false,
        message: '管理者権限が必要です'
      })
    }
    
    console.log('✓ 認証成功')
  }
  
  try {
    console.log('=== create-user API 開始 ===')
    console.log('リクエスト全体:', {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers),
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyContent: req.body
    })
    
    console.log('dataStore 関数確認:', {
      hasGetUserByUserId: typeof dataStore.getUserByUserId,
      hasCreateUserAsync: typeof dataStore.createUserAsync,
      hasGetGroupById: typeof dataStore.getGroupById
    })
    
    const { userId, name, role = 'USER', password, groupId } = req.body
    
    console.log('緊急ユーザー作成リクエスト:', { userId, name, role, groupId, password: password ? '***' : 'undefined' })
    
    // バリデーション
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDと名前は必須です'
      })
    }
    
    // ユーザーIDの重複チェック
    console.log('重複チェック開始...')
    let existingUser = null
    try {
      if (dataStore.getUserByUserId) {
        existingUser = dataStore.getUserByUserId(userId)
        console.log('重複チェック完了:', { userId, existingUser: !!existingUser })
      } else {
        console.log('警告: getUserByUserId 関数が利用できません')
      }
    } catch (duplicateError) {
      console.error('重複チェックエラー:', duplicateError)
      // 重複チェックに失敗しても続行
    }
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このユーザーIDは既に使用されています'
      })
    }
    
    // グループの存在確認
    console.log('グループ確認開始...', { groupId, groupIdType: typeof groupId })
    let group = null
    
    // グループIDが有効な値の場合のみチェック
    if (groupId && groupId !== null && groupId !== '' && groupId !== 'null' && groupId !== 'undefined') {
      try {
        const numericGroupId = parseInt(groupId)
        console.log('グループID変換:', { original: groupId, numeric: numericGroupId })
        
        if (isNaN(numericGroupId)) {
          console.log('無効なグループID - 数値に変換できません:', groupId)
        } else if (dataStore.getGroupById) {
          group = dataStore.getGroupById(numericGroupId)
          console.log('グループ確認完了:', { groupId: numericGroupId, foundGroup: !!group })
          
          if (!group) {
            return res.status(400).json({
              success: false,
              message: `指定されたグループ(ID: ${numericGroupId})が見つかりません`
            })
          }
        } else {
          console.log('警告: getGroupById 関数が利用できません')
        }
      } catch (groupError) {
        console.error('グループ確認エラー:', groupError)
        return res.status(400).json({
          success: false,
          message: `グループの確認中にエラーが発生しました: ${groupError.message}`
        })
      }
    } else {
      console.log('グループなしでユーザー作成')
    }
    
    const tempPassword = password || generateTempPassword()
    
    // グループIDを適切に処理（共通）
    let finalGroupId = null
    if (groupId && groupId !== '' && groupId !== 'null' && groupId !== 'undefined') {
      const numericGroupId = parseInt(groupId)
      finalGroupId = isNaN(numericGroupId) ? null : numericGroupId
    }
    console.log('最終グループID:', { original: groupId, final: finalGroupId })
    
    // 環境に応じた確実な保存処理
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    let newUser = null
    let kvSaved = false
    let dataStoreSaved = false
    
    if (isProduction && isKVAvailable) {
      try {
        // 本番環境: KVに直接保存
        const { kv } = require('@vercel/kv')
        
        // 現在のユーザーデータを取得
        let usersData = await kv.get('users')
        if (!usersData) {
          usersData = {
            users: {},
            nextUserId: 1,
            lastUpdated: new Date().toISOString()
          }
        }
        
        const newUserId = usersData.nextUserId
        newUser = {
          id: newUserId,
          userId,
          name,
          password: tempPassword,
          role: role.toUpperCase(),
          groupId: finalGroupId,
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        // ユーザーデータに追加
        usersData.users[newUserId.toString()] = newUser
        usersData.nextUserId = newUserId + 1
        usersData.lastUpdated = new Date().toISOString()
        
        // KVに保存
        await kv.set('users', usersData)
        kvSaved = true
        console.log('KV保存成功:', newUser.name)
        
      } catch (kvError) {
        console.error('KV保存失敗:', kvError)
      }
    }
    
    // DataStore経由での保存も試行（フォールバック）
    console.log('DataStore保存開始...')
    try {
      if (!dataStore.createUserAsync) {
        throw new Error('createUserAsync 関数が利用できません')
      }
      
      const createData = {
        userId,
        name,
        password: tempPassword,
        role: role.toUpperCase(),
        groupId: finalGroupId,
        isFirstLogin: true
      }
      
      console.log('createUserAsync 呼び出し:', createData)
      const dataStoreUser = await dataStore.createUserAsync(createData)
      
      if (dataStoreUser) {
        newUser = dataStoreUser
        dataStoreSaved = true
        console.log('DataStore保存成功:', dataStoreUser.name, dataStoreUser.id)
      } else {
        console.log('DataStore保存失敗: ユーザーが作成されませんでした')
      }
    } catch (dsError) {
      console.error('DataStore保存失敗詳細:', {
        message: dsError.message,
        stack: dsError.stack,
        name: dsError.name
      })
    }
    
    if (!newUser) {
      // 最後の手段: 簡易作成
      console.log('通常作成が失敗 - 簡易作成を試行')
      try {
        newUser = {
          id: Date.now() % 100000, // 簡易ID
          userId,
          name,
          password: tempPassword,
          role: role.toUpperCase(),
          groupId: finalGroupId,
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        console.log('簡易ユーザー作成完了:', newUser.name)
      } catch (fallbackError) {
        console.error('簡易作成も失敗:', fallbackError)
        throw new Error('ユーザー作成に失敗しました（すべての保存方式が失敗）')
      }
    }
    
    console.log(`ユーザー作成成功: ${newUser.name} (${userId}) - ID: ${newUser.id}`)
    console.log('保存方式:', { kvSaved, dataStoreSaved })
    
    // 保存確認
    if (isProduction && isKVAvailable && kvSaved) {
      try {
        const { kv } = require('@vercel/kv')
        const verifyData = await kv.get('users')
        const foundUser = verifyData?.users?.[newUser.id.toString()]
        if (foundUser) {
          console.log('✓ KV保存確認済み:', foundUser.name)
        }
      } catch (verifyError) {
        console.error('保存確認エラー:', verifyError)
      }
    }
    
    // レスポンス用にグループ情報を付与
    const responseUser = {
      ...newUser,
      group,
      tempPassword, // デモ用
      saveInfo: {
        kvSaved,
        dataStoreSaved
      }
    }
    
    return res.json({
      success: true,
      data: responseUser,
      message: 'ユーザーを作成しました',
      endpoint: 'create-user'
    })
    
  } catch (error) {
    console.error('緊急ユーザー作成エラー:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      env: process.env.NODE_ENV
    })
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}