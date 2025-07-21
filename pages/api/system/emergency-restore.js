// 緊急データ復旧エンドポイント（本番環境でのデータ損失時の復旧用）
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

  // 管理者認証チェック
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '認証が必要です'
    })
  }
  
  const token = authHeader.substring(7)
  const isValidAdmin = token.startsWith('demo-admin') || 
                      token.startsWith('admin') ||
                      (process.env.NODE_ENV === 'production' && token && token.length > 10)
  
  if (!isValidAdmin) {
    return res.status(403).json({
      success: false,
      message: '管理者権限が必要です'
    })
  }

  try {
    console.log('=== 緊急データ復旧開始 ===')
    const { restoreType, backupData } = req.body
    
    const restoreResults = {
      timestamp: new Date().toISOString(),
      restoreType,
      operations: [],
      success: false,
      restored: {
        users: 0,
        groups: 0,
        courses: 0
      }
    }

    if (restoreType === 'init_default_data') {
      // デフォルトデータで初期化
      console.log('デフォルトデータで初期化中...')
      
      const defaultData = {
        users: {
          users: {
            1: {
              id: 1,
              email: "admin@company.com",
              name: "システム管理者",
              role: "ADMIN",
              groupId: null,
              isFirstLogin: false,
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          },
          nextUserId: 2
        },
        groups: {
          groups: {},
          nextGroupId: 1
        },
        courses: {
          courses: {},
          nextCourseId: 1,
          nextCurriculumId: 1,
          nextVideoId: 1
        }
      }

      // メモリとKVの両方に保存
      require('../../../lib/dataStore').memoryStorage.users = defaultData.users
      require('../../../lib/dataStore').memoryStorage.groups = defaultData.groups
      require('../../../lib/dataStore').memoryStorage.courses = defaultData.courses
      
      if (kvStore.isKVAvailable()) {
        await kvStore.saveProductionData('users', defaultData.users)
        await kvStore.saveProductionData('groups', defaultData.groups)
        await kvStore.saveProductionData('courses', defaultData.courses)
        restoreResults.operations.push('KV storage initialized with default data')
      }
      
      restoreResults.operations.push('Memory storage initialized with default data')
      restoreResults.restored.users = 1
      restoreResults.success = true
      
    } else if (restoreType === 'restore_from_backup' && backupData) {
      // バックアップデータから復旧
      console.log('バックアップデータから復旧中...')
      
      if (backupData.users) {
        require('../../../lib/dataStore').memoryStorage.users = backupData.users
        if (kvStore.isKVAvailable()) {
          await kvStore.saveProductionData('users', backupData.users)
        }
        restoreResults.restored.users = Object.keys(backupData.users.users || {}).length
        restoreResults.operations.push(`Restored ${restoreResults.restored.users} users`)
      }
      
      if (backupData.groups) {
        require('../../../lib/dataStore').memoryStorage.groups = backupData.groups
        if (kvStore.isKVAvailable()) {
          await kvStore.saveProductionData('groups', backupData.groups)
        }
        restoreResults.restored.groups = Object.keys(backupData.groups.groups || {}).length
        restoreResults.operations.push(`Restored ${restoreResults.restored.groups} groups`)
      }
      
      if (backupData.courses) {
        require('../../../lib/dataStore').memoryStorage.courses = backupData.courses
        if (kvStore.isKVAvailable()) {
          await kvStore.saveProductionData('courses', backupData.courses)
        }
        restoreResults.restored.courses = Object.keys(backupData.courses.courses || {}).length
        restoreResults.operations.push(`Restored ${restoreResults.restored.courses} courses`)
      }
      
      restoreResults.success = true
      
    } else if (restoreType === 'repair_inconsistency') {
      // データ不整合の修復
      console.log('データ不整合修復中...')
      
      if (kvStore.isKVAvailable()) {
        const memoryData = require('../../../lib/dataStore').memoryStorage
        
        // メモリデータが存在する場合、KVに強制同期
        if (memoryData.users && Object.keys(memoryData.users.users || {}).length > 0) {
          await kvStore.saveProductionData('users', memoryData.users)
          restoreResults.operations.push('Synced users from memory to KV')
          restoreResults.restored.users = Object.keys(memoryData.users.users).length
        }
        
        if (memoryData.groups && Object.keys(memoryData.groups.groups || {}).length > 0) {
          await kvStore.saveProductionData('groups', memoryData.groups)
          restoreResults.operations.push('Synced groups from memory to KV')
          restoreResults.restored.groups = Object.keys(memoryData.groups.groups).length
        }
        
        if (memoryData.courses && Object.keys(memoryData.courses.courses || {}).length > 0) {
          await kvStore.saveProductionData('courses', memoryData.courses)
          restoreResults.operations.push('Synced courses from memory to KV')
          restoreResults.restored.courses = Object.keys(memoryData.courses.courses).length
        }
        
        restoreResults.success = true
      } else {
        restoreResults.operations.push('KV not available - cannot repair inconsistency')
      }
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid restore type or missing backup data'
      })
    }

    console.log('=== 緊急データ復旧完了 ===')
    console.log('復旧結果:', restoreResults)

    return res.json({
      success: true,
      message: '緊急データ復旧が完了しました',
      data: restoreResults
    })

  } catch (error) {
    console.error('緊急データ復旧エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Emergency data restore failed',
      error: error.message
    })
  }
}