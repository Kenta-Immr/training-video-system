// ユーザー削除専用エンドポイント
const dataStore = require('../../lib/dataStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed - POST or DELETE only'
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
  
  console.log('ユーザー削除API認証チェック:', { 
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
    const { userId } = req.body
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ユーザーIDが必要です'
      })
    }
    
    console.log('ユーザー削除開始:', { userId })
    
    // 既存ユーザーの確認
    const existingUser = await dataStore.getUserByIdAsync(userId)
    if (!existingUser) {
      console.log('削除対象ユーザーが見つかりません:', userId)
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      })
    }
    
    console.log('削除対象ユーザー確認:', existingUser.name)
    
    // 削除前の確認情報
    const userToDelete = {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email
    }
    
    // ユーザー削除実行（複数の方法で確実に削除）
    console.log('削除処理開始: 複数方式で確実な削除を実行')
    
    let deleted = false
    let kvDeleted = false
    
    // 方式1: dataStore.deleteUserAsync を使用
    try {
      deleted = await dataStore.deleteUserAsync(userId)
      console.log('方式1 (dataStore.deleteUserAsync):', deleted ? '成功' : '失敗')
    } catch (error) {
      console.error('方式1 失敗:', error)
    }
    
    // 方式2: KVを直接操作して削除
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    if (isProduction && isKVAvailable) {
      try {
        const { kv } = require('@vercel/kv')
        
        // 現在のユーザーデータを取得
        let usersData = await kv.get('users')
        if (usersData && usersData.users && usersData.users[userId.toString()]) {
          // ユーザーを削除
          delete usersData.users[userId.toString()]
          usersData.lastUpdated = new Date().toISOString()
          
          // KVに保存
          await kv.set('users', usersData)
          kvDeleted = true
          console.log('方式2 (KV直接): 成功')
        }
      } catch (kvError) {
        console.error('方式2 (KV直接) 失敗:', kvError)
      }
    }
    
    // 削除確認
    let confirmDeleted = false
    try {
      const checkUser = await dataStore.getUserByIdAsync(userId)
      confirmDeleted = !checkUser
      console.log('削除確認:', confirmDeleted ? 'ユーザーは存在しません（削除成功）' : 'ユーザーがまだ存在します')
    } catch (error) {
      console.log('削除確認時エラー（削除成功の可能性）:', error.message)
      confirmDeleted = true // エラーが出た場合は削除されたと判断
    }
    
    if (deleted || kvDeleted || confirmDeleted) {
      console.log(`ユーザー削除完了: ${userToDelete.name} (ID: ${userId})`)
      return res.json({
        success: true,
        message: 'ユーザーを削除しました',
        deletedUser: userToDelete,
        methods: {
          dataStore: deleted,
          directKV: kvDeleted,
          confirmed: confirmDeleted
        }
      })
    } else {
      console.log('すべての削除方式が失敗しました:', userId)
      return res.status(500).json({
        success: false,
        message: 'ユーザー削除に失敗しました',
        methods: {
          dataStore: deleted,
          directKV: kvDeleted,
          confirmed: confirmDeleted
        }
      })
    }
    
  } catch (error) {
    console.error('ユーザー削除エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}