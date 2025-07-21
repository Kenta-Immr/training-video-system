// 本番環境診断エンドポイント（包括的データ整合性チェック）
const dataStore = require('../../../lib/dataStore')
const kvStore = require('../../../lib/kvStore')

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    })
  }

  try {
    console.log('=== 包括的診断開始 ===')
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!(process.env.VERCEL || process.env.NODE_ENV === 'production'),
        hasKVUrl: !!process.env.KV_REST_API_URL,
        hasKVToken: !!process.env.KV_REST_API_TOKEN,
        platform: process.platform || 'unknown'
      },
      storage: {
        kvAvailable: false,
        kvConnectionTest: null,
        memoryUsage: process.memoryUsage()
      },
      data: {
        courses: { count: 0, integrity: 'unknown' },
        users: { count: 0, integrity: 'unknown' },
        groups: { count: 0, integrity: 'unknown' },
        dataConsistency: 'unknown'
      },
      operations: {
        testCreateCourse: null,
        testCreateUser: null,
        testCreateGroup: null
      },
      performance: {
        dataLoadTime: 0,
        kvResponseTime: 0
      }
    }

    // KVストレージ診断
    try {
      const kvStart = Date.now()
      diagnosis.storage.kvAvailable = kvStore.isKVAvailable()
      
      if (diagnosis.storage.kvAvailable) {
        console.log('KV接続テスト実行中...')
        diagnosis.storage.kvConnectionTest = await kvStore.testKVConnection()
        diagnosis.performance.kvResponseTime = Date.now() - kvStart
        console.log('KV接続テスト結果:', diagnosis.storage.kvConnectionTest)
      } else {
        console.log('KV利用不可のためテストスキップ')
        diagnosis.storage.kvConnectionTest = { success: false, reason: 'KV not available' }
      }
    } catch (kvError) {
      console.error('KV診断エラー:', kvError)
      diagnosis.storage.kvConnectionTest = { success: false, reason: kvError.message }
    }

    // データ整合性チェック
    try {
      const dataStart = Date.now()
      console.log('データ整合性チェック中...')
      
      const [courses, users, groups] = await Promise.all([
        dataStore.getCoursesAsync(),
        dataStore.getUsersAsync(),
        dataStore.getGroupsAsync()
      ])
      
      diagnosis.performance.dataLoadTime = Date.now() - dataStart
      
      // データ数と構造チェック
      diagnosis.data.courses = {
        count: courses.length,
        integrity: courses.every(c => c.id && c.title && c.createdAt) ? 'valid' : 'invalid',
        sampleIds: courses.slice(0, 3).map(c => c.id)
      }
      
      diagnosis.data.users = {
        count: users.length,
        integrity: users.every(u => u.id && u.email && u.name) ? 'valid' : 'invalid',
        sampleIds: users.slice(0, 3).map(u => u.id),
        adminCount: users.filter(u => u.role === 'ADMIN').length
      }
      
      diagnosis.data.groups = {
        count: groups.length,
        integrity: groups.every(g => g.id && g.name && g.code) ? 'valid' : 'invalid',
        sampleIds: groups.slice(0, 3).map(g => g.id),
        codes: groups.map(g => g.code)
      }
      
      // データ整合性（参照整合性チェック）
      const groupUserConsistency = users.filter(u => u.groupId).every(u => 
        groups.some(g => g.id === u.groupId)
      )
      
      diagnosis.data.dataConsistency = groupUserConsistency ? 'consistent' : 'inconsistent'
      
      console.log('データ件数:', {
        courses: diagnosis.data.courses.count,
        users: diagnosis.data.users.count,
        groups: diagnosis.data.groups.count
      })
      
    } catch (dataError) {
      console.error('データ整合性チェックエラー:', dataError)
      diagnosis.data.error = dataError.message
    }

    // 作成操作テスト（安全なテストデータ）
    if (req.query.testOperations === 'true') {
      try {
        console.log('作成操作テスト開始...')
        
        // テストコース作成・削除
        try {
          const testCourse = await dataStore.createCourseAsync({
            title: `診断テスト_${Date.now()}`,
            description: 'システム診断用テストコース',
            thumbnailUrl: 'https://via.placeholder.com/400x300'
          })
          
          if (testCourse && testCourse.id) {
            diagnosis.operations.testCreateCourse = { success: true, id: testCourse.id }
            // テストデータを削除
            await dataStore.deleteCourse(testCourse.id)
          } else {
            diagnosis.operations.testCreateCourse = { success: false, reason: 'Course creation returned null' }
          }
        } catch (courseError) {
          diagnosis.operations.testCreateCourse = { success: false, reason: courseError.message }
        }
        
        // テストグループ作成・削除
        try {
          const testGroup = await dataStore.createGroupAsync({
            name: `診断テスト_${Date.now()}`,
            code: `TEST_${Date.now()}`,
            description: 'システム診断用テストグループ'
          })
          
          if (testGroup && testGroup.id) {
            diagnosis.operations.testCreateGroup = { success: true, id: testGroup.id }
            // テストデータを削除
            await dataStore.deleteGroup(testGroup.id)
          } else {
            diagnosis.operations.testCreateGroup = { success: false, reason: 'Group creation returned null' }
          }
        } catch (groupError) {
          diagnosis.operations.testCreateGroup = { success: false, reason: groupError.message }
        }
        
        console.log('作成操作テスト完了')
        
      } catch (operationError) {
        console.error('作成操作テストエラー:', operationError)
        diagnosis.operations.error = operationError.message
      }
    }

    console.log('=== 包括的診断完了 ===')
    console.log('診断結果:', JSON.stringify(diagnosis, null, 2))

    // 総合判定
    const overallHealth = 
      diagnosis.storage.kvAvailable && 
      diagnosis.storage.kvConnectionTest?.success &&
      diagnosis.data.courses.integrity === 'valid' &&
      diagnosis.data.users.integrity === 'valid' &&
      diagnosis.data.groups.integrity === 'valid' &&
      diagnosis.data.dataConsistency === 'consistent'

    return res.json({
      success: true,
      overallHealth,
      data: diagnosis,
      recommendations: generateRecommendations(diagnosis)
    })

  } catch (error) {
    console.error('包括的診断エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Comprehensive diagnostics failed',
      error: error.message
    })
  }
}

function generateRecommendations(diagnosis) {
  const recommendations = []
  
  if (!diagnosis.storage.kvAvailable) {
    recommendations.push('KVストレージが利用できません。環境変数を確認してください。')
  }
  
  if (diagnosis.storage.kvConnectionTest && !diagnosis.storage.kvConnectionTest.success) {
    recommendations.push('KV接続テストが失敗しました。ネットワークとKV設定を確認してください。')
  }
  
  if (diagnosis.data.courses.integrity === 'invalid') {
    recommendations.push('コースデータに整合性の問題があります。')
  }
  
  if (diagnosis.data.users.integrity === 'invalid') {
    recommendations.push('ユーザーデータに整合性の問題があります。')
  }
  
  if (diagnosis.data.groups.integrity === 'invalid') {
    recommendations.push('グループデータに整合性の問題があります。')
  }
  
  if (diagnosis.data.dataConsistency === 'inconsistent') {
    recommendations.push('データ間の参照整合性に問題があります。')
  }
  
  if (diagnosis.performance.kvResponseTime > 5000) {
    recommendations.push('KVレスポンス時間が遅いです。ネットワーク状況を確認してください。')
  }
  
  if (diagnosis.performance.dataLoadTime > 3000) {
    recommendations.push('データ読み込み時間が遅いです。パフォーマンスの最適化を検討してください。')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('システムは正常に動作しています。')
  }
  
  return recommendations
}