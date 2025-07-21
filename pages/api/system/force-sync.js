// 緊急データ同期エンドポイント（本番環境でのデータ表示問題の解決用）
const dataStore = require('../../../lib/dataStore')
const kvStore = require('../../../lib/kvStore')

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
      message: 'Method not allowed'
    })
  }

  try {
    console.log('=== 緊急データ同期開始 ===')
    const syncResults = {
      timestamp: new Date().toISOString(),
      operations: [],
      memoryRefresh: false,
      kvSync: false,
      dataIntegrity: {}
    }

    // ステップ1: KVから最新データを強制取得
    console.log('ステップ1: KVから最新データ強制取得')
    try {
      if (kvStore.isKVAvailable()) {
        const [kvCourses, kvUsers, kvGroups] = await Promise.all([
          kvStore.getProductionData('courses'),
          kvStore.getProductionData('users'),  
          kvStore.getProductionData('groups')
        ])
        
        // メモリストレージを強制更新
        if (kvCourses) {
          require('../../../lib/dataStore').memoryStorage.courses = kvCourses
          syncResults.operations.push('courses memory updated from KV')
        }
        
        if (kvUsers) {
          require('../../../lib/dataStore').memoryStorage.users = kvUsers
          syncResults.operations.push('users memory updated from KV')
        }
        
        if (kvGroups) {
          require('../../../lib/dataStore').memoryStorage.groups = kvGroups
          syncResults.operations.push('groups memory updated from KV')
        }
        
        syncResults.memoryRefresh = true
        console.log('✓ KVからメモリストレージ同期完了')
      } else {
        console.log('KV利用不可 - メモリデータをそのまま使用')
      }
    } catch (kvError) {
      console.error('KV同期エラー:', kvError)
      syncResults.operations.push(`KV sync error: ${kvError.message}`)
    }

    // ステップ2: 現在のデータ件数を確認
    console.log('ステップ2: データ整合性確認')
    try {
      const [courses, users, groups] = await Promise.all([
        dataStore.getCoursesAsync(),
        dataStore.getUsersAsync(),
        dataStore.getGroupsAsync()
      ])
      
      syncResults.dataIntegrity = {
        courses: {
          count: courses.length,
          ids: courses.map(c => c.id),
          valid: courses.every(c => c.id && c.title && c.createdAt)
        },
        users: {
          count: users.length,
          ids: users.map(u => u.id),
          valid: users.every(u => u.id && u.email && u.name)
        },
        groups: {
          count: groups.length,
          ids: groups.map(g => g.id),
          codes: groups.map(g => g.code),
          valid: groups.every(g => g.id && g.name && g.code)
        }
      }
      
      console.log('データ整合性チェック完了:', syncResults.dataIntegrity)
    } catch (dataError) {
      console.error('データ整合性チェックエラー:', dataError)
      syncResults.operations.push(`Data integrity error: ${dataError.message}`)
    }

    // ステップ3: KVへの逆同期（メモリデータが新しい場合）
    console.log('ステップ3: 必要に応じてKVへ逆同期')
    if (kvStore.isKVAvailable() && req.body.forceKvSync) {
      try {
        const memoryData = require('../../../lib/dataStore').memoryStorage
        
        if (memoryData.courses) {
          await kvStore.saveProductionData('courses', memoryData.courses)
          syncResults.operations.push('courses synced to KV')
        }
        
        if (memoryData.users) {
          await kvStore.saveProductionData('users', memoryData.users)
          syncResults.operations.push('users synced to KV')
        }
        
        if (memoryData.groups) {
          await kvStore.saveProductionData('groups', memoryData.groups)
          syncResults.operations.push('groups synced to KV')
        }
        
        syncResults.kvSync = true
        console.log('✓ KVへの逆同期完了')
      } catch (kvSyncError) {
        console.error('KV逆同期エラー:', kvSyncError)
        syncResults.operations.push(`KV reverse sync error: ${kvSyncError.message}`)
      }
    }

    console.log('=== 緊急データ同期完了 ===')
    
    return res.json({
      success: true,
      message: '緊急データ同期が完了しました',
      data: syncResults,
      recommendations: generateSyncRecommendations(syncResults)
    })

  } catch (error) {
    console.error('緊急データ同期エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Emergency data sync failed',
      error: error.message
    })
  }
}

function generateSyncRecommendations(syncResults) {
  const recommendations = []
  
  if (!syncResults.memoryRefresh) {
    recommendations.push('メモリリフレッシュに失敗しています。KV接続を確認してください。')
  }
  
  if (!syncResults.kvSync) {
    recommendations.push('KV同期が実行されていません。forceKvSync=trueで再実行してください。')
  }
  
  if (syncResults.dataIntegrity.courses && !syncResults.dataIntegrity.courses.valid) {
    recommendations.push('コースデータに不正な項目があります。')
  }
  
  if (syncResults.dataIntegrity.users && !syncResults.dataIntegrity.users.valid) {
    recommendations.push('ユーザーデータに不正な項目があります。')
  }
  
  if (syncResults.dataIntegrity.groups && !syncResults.dataIntegrity.groups.valid) {
    recommendations.push('グループデータに不正な項目があります。')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('データ同期は正常に完了しました。フロントエンドでページをリフレッシュしてください。')
  }
  
  return recommendations
}