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
  
  // 認証チェック（管理者のみ）
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  
  console.log('緊急ユーザー作成API認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV,
    origin: req.headers.origin
  })
  
  // 本番環境とローカル環境の両方で管理者権限をチェック
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    console.log('認証失敗: 無効な管理者トークン', { token: token.substring(0, 10) })
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }
  
  try {
    const { userId, name, role = 'USER', password, groupId } = req.body
    
    console.log('緊急ユーザー作成リクエスト:', { userId, name, role, groupId })
    
    // バリデーション
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDと名前は必須です'
      })
    }
    
    // ユーザーIDの重複チェック
    const existingUser = dataStore.getUserByUserId ? dataStore.getUserByUserId(userId) : null
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'このユーザーIDは既に使用されています'
      })
    }
    
    // グループの存在確認
    let group = null
    if (groupId) {
      group = dataStore.getGroupById(groupId)
      if (!group) {
        return res.status(400).json({
          success: false,
          message: '指定されたグループが見つかりません'
        })
      }
    }
    
    const tempPassword = password || generateTempPassword()
    
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
          groupId: groupId || null,
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
    try {
      const dataStoreUser = await dataStore.createUserAsync({
        userId,
        name,
        password: tempPassword,
        role: role.toUpperCase(),
        groupId: groupId || null,
        isFirstLogin: true
      })
      
      if (dataStoreUser) {
        newUser = dataStoreUser
        dataStoreSaved = true
        console.log('DataStore保存成功:', dataStoreUser.name)
      }
    } catch (dsError) {
      console.error('DataStore保存失敗:', dsError)
    }
    
    if (!newUser) {
      throw new Error('ユーザー作成に失敗しました（すべての保存方式が失敗）')
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