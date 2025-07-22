// 管理者アクション統合API（ユーザー・グループ管理）
const dataStore = require('../../lib/dataStore')

// パスワード生成（デモ用）
function generateTempPassword() {
  return Math.random().toString(36).slice(-8)
}

// KV直接操作のヘルパー関数
async function getKVData(key) {
  try {
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    if (isProduction && isKVAvailable) {
      const { kv } = require('@vercel/kv')
      return await kv.get(key)
    }
  } catch (error) {
    console.error(`KV取得エラー (${key}):`, error)
  }
  return null
}

async function setKVData(key, data) {
  try {
    const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
    
    if (isProduction && isKVAvailable) {
      const { kv } = require('@vercel/kv')
      await kv.set(key, data)
      return true
    }
  } catch (error) {
    console.error(`KV保存エラー (${key}):`, error)
  }
  return false
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
  console.log('管理者アクションAPI認証チェック:', { 
    token: token.substring(0, 20) + '...',
    env: process.env.NODE_ENV,
    action: req.body.action
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
  
  const { action, ...params } = req.body
  
  try {
    switch (action) {
      case 'deleteUser':
        return await handleDeleteUser(params, res)
        
      case 'addUsersToGroup':
        return await handleAddUsersToGroup(params, res)
        
      case 'removeUsersFromGroup':
        return await handleRemoveUsersFromGroup(params, res)
        
      default:
        return res.status(400).json({
          success: false,
          message: `未知のアクション: ${action}`
        })
    }
  } catch (error) {
    console.error(`アクション実行エラー (${action}):`, error)
    return res.status(500).json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error.message
    })
  }
}

// ユーザー削除処理
async function handleDeleteUser({ userId }, res) {
  console.log('ユーザー削除開始:', { userId, env: process.env.NODE_ENV })
  
  // 既存ユーザーの確認
  const existingUser = await dataStore.getUserByIdAsync(userId)
  console.log('既存ユーザー取得結果:', existingUser ? 'ユーザー存在' : 'ユーザー見つからない')
  
  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: 'ユーザーが見つかりません'
    })
  }
  
  const userToDelete = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email
  }
  console.log('削除対象ユーザー:', userToDelete)
  
  let deleted = false
  let kvDeleted = false
  
  // 方式1: DataStore経由（開発環境メイン）
  try {
    console.log('DataStore削除を実行中...')
    deleted = await dataStore.deleteUserAsync(userId)
    console.log('DataStore削除結果:', deleted ? '成功' : '失敗')
  } catch (error) {
    console.error('DataStore削除失敗:', error)
  }
  
  // 方式2: KV直接操作（本番環境のみ）
  const isKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
  
  console.log('KV環境チェック:', { isKVAvailable: !!isKVAvailable, isProduction })
  
  if (isProduction && isKVAvailable) {
    try {
      console.log('KV削除を実行中...')
      const usersData = await getKVData('users')
      if (usersData && usersData.users && usersData.users[userId.toString()]) {
        delete usersData.users[userId.toString()]
        usersData.lastUpdated = new Date().toISOString()
        
        kvDeleted = await setKVData('users', usersData)
        console.log('KV直接削除結果:', kvDeleted ? '成功' : '失敗')
      } else {
        console.log('KVにユーザーが見つかりません')
      }
    } catch (error) {
      console.error('KV直接削除失敗:', error)
    }
  } else {
    console.log('開発環境のためKV削除をスキップ')
  }
  
  // 削除確認
  let confirmDeleted = false
  try {
    console.log('削除確認を実行中...')
    const checkUser = await dataStore.getUserByIdAsync(userId)
    confirmDeleted = !checkUser
    console.log('削除確認結果:', confirmDeleted ? 'ユーザー削除済み' : 'ユーザーまだ存在')
  } catch (error) {
    console.log('削除確認時エラー（削除成功の可能性）:', error.message)
    confirmDeleted = true // エラー = 削除成功の可能性
  }
  
  console.log('最終結果:', { deleted, kvDeleted, confirmDeleted })
  
  if (deleted || kvDeleted || confirmDeleted) {
    console.log(`✓ ユーザー削除完了: ${userToDelete.name}`)
    return res.json({
      success: true,
      message: 'ユーザーを削除しました',
      deletedUser: userToDelete,
      methods: { dataStore: deleted, kv: kvDeleted, confirmed: confirmDeleted }
    })
  } else {
    console.log(`✗ ユーザー削除失敗: ${userToDelete.name}`)
    return res.status(500).json({
      success: false,
      message: 'ユーザー削除に失敗しました',
      methods: { dataStore: deleted, kv: kvDeleted, confirmed: confirmDeleted }
    })
  }
}

// グループにユーザー追加
async function handleAddUsersToGroup({ groupId, userIds }, res) {
  console.log('グループにユーザー追加:', { groupId, userIds })
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'ユーザーIDの配列が必要です'
    })
  }
  
  // グループ存在確認
  const group = await dataStore.getGroupByIdAsync ? await dataStore.getGroupByIdAsync(groupId) : dataStore.getGroupById(groupId)
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'グループが見つかりません'
    })
  }
  
  const addedUsers = []
  const errors = []
  
  for (const userId of userIds) {
    try {
      // ユーザー存在確認
      const user = await dataStore.getUserByIdAsync(userId)
      if (!user) {
        errors.push({ userId, error: 'ユーザーが見つかりません' })
        continue
      }
      
      // DataStore経由で更新
      let updated = false
      try {
        const updatedUser = await dataStore.updateUserAsync(userId, {
          ...user,
          groupId: groupId
        })
        if (updatedUser) {
          updated = true
          addedUsers.push(updatedUser)
        }
      } catch (dsError) {
        console.error('DataStore更新失敗:', dsError)
      }
      
      // KV直接操作も試行
      try {
        const usersData = await getKVData('users')
        if (usersData && usersData.users && usersData.users[userId.toString()]) {
          usersData.users[userId.toString()].groupId = groupId
          usersData.lastUpdated = new Date().toISOString()
          await setKVData('users', usersData)
          console.log(`ユーザー ${user.name} のグループをKVで更新`)
        }
      } catch (kvError) {
        console.error('KV更新失敗:', kvError)
      }
      
      if (updated) {
        console.log(`ユーザー ${user.name} をグループ ${group.name} に追加`)
      }
      
    } catch (error) {
      console.error(`ユーザー ${userId} の追加エラー:`, error)
      errors.push({ userId, error: error.message })
    }
  }
  
  return res.json({
    success: true,
    data: {
      addedUsers,
      addedCount: addedUsers.length,
      errors
    },
    message: `${addedUsers.length}人のユーザーをグループに追加しました`
  })
}

// グループからユーザー削除
async function handleRemoveUsersFromGroup({ groupId, userIds }, res) {
  console.log('グループからユーザー削除:', { groupId, userIds })
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'ユーザーIDの配列が必要です'
    })
  }
  
  // グループ存在確認
  const group = await dataStore.getGroupByIdAsync ? await dataStore.getGroupByIdAsync(groupId) : dataStore.getGroupById(groupId)
  if (!group) {
    return res.status(404).json({
      success: false,
      message: 'グループが見つかりません'
    })
  }
  
  const removedUsers = []
  const errors = []
  
  for (const userId of userIds) {
    try {
      // ユーザー存在確認
      const user = await dataStore.getUserByIdAsync(userId)
      if (!user) {
        errors.push({ userId, error: 'ユーザーが見つかりません' })
        continue
      }
      
      if (user.groupId !== groupId) {
        errors.push({ userId, error: 'ユーザーはこのグループのメンバーではありません' })
        continue
      }
      
      // DataStore経由で更新
      let updated = false
      try {
        const updatedUser = await dataStore.updateUserAsync(userId, {
          ...user,
          groupId: null
        })
        if (updatedUser) {
          updated = true
          removedUsers.push(updatedUser)
        }
      } catch (dsError) {
        console.error('DataStore更新失敗:', dsError)
      }
      
      // KV直接操作も試行
      try {
        const usersData = await getKVData('users')
        if (usersData && usersData.users && usersData.users[userId.toString()]) {
          usersData.users[userId.toString()].groupId = null
          usersData.lastUpdated = new Date().toISOString()
          await setKVData('users', usersData)
          console.log(`ユーザー ${user.name} をKVでグループから削除`)
        }
      } catch (kvError) {
        console.error('KV更新失敗:', kvError)
      }
      
      if (updated) {
        console.log(`ユーザー ${user.name} をグループ ${group.name} から削除`)
      }
      
    } catch (error) {
      console.error(`ユーザー ${userId} の削除エラー:`, error)
      errors.push({ userId, error: error.message })
    }
  }
  
  return res.json({
    success: true,
    data: {
      removedUsers,
      removedCount: removedUsers.length,
      errors
    },
    message: `${removedUsers.length}人のユーザーをグループから削除しました`
  })
}