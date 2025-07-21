// 自動データ修復エンドポイント（リロード後消失問題の自動解決用）
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
    console.log('=== 自動データ修復開始 ===')
    
    const fixResults = {
      timestamp: new Date().toISOString(),
      operations: [],
      fixed: {
        users: false,
        groups: false,
        courses: false
      },
      summary: {
        issuesFound: 0,
        issuesFixed: 0
      }
    }

    // 1. 現在の状態を調査
    console.log('1. データ状態調査中...')
    const memoryStorage = require('../../../lib/dataStore').memoryStorage
    
    const memoryUsersCount = memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0
    const memoryGroupsCount = memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0
    const memoryCourseCount = memoryStorage.courses ? Object.keys(memoryStorage.courses.courses || {}).length : 0
    
    let kvUsersCount = 0
    let kvGroupsCount = 0
    let kvCoursesCount = 0
    
    if (kvStore.isKVAvailable()) {
      try {
        const [kvUsers, kvGroups, kvCourses] = await Promise.all([
          kvStore.getProductionData('users'),
          kvStore.getProductionData('groups'),
          kvStore.getProductionData('courses')
        ])
        
        kvUsersCount = kvUsers ? Object.keys(kvUsers.users || {}).length : 0
        kvGroupsCount = kvGroups ? Object.keys(kvGroups.groups || {}).length : 0
        kvCoursesCount = kvCourses ? Object.keys(kvCourses.courses || {}).length : 0
      } catch (kvError) {
        console.error('KVデータ取得エラー:', kvError)
        fixResults.operations.push(`KV data fetch error: ${kvError.message}`)
      }
    }

    console.log('データ状態:', {
      memory: { users: memoryUsersCount, groups: memoryGroupsCount, courses: memoryCourseCount },
      kv: { users: kvUsersCount, groups: kvGroupsCount, courses: kvCoursesCount }
    })

    // 2. 問題を特定
    console.log('2. 問題特定中...')
    
    // ユーザーデータの不整合
    if (memoryUsersCount > kvUsersCount) {
      fixResults.summary.issuesFound++
      fixResults.operations.push(`Issue found: Users in memory(${memoryUsersCount}) > KV(${kvUsersCount})`)
      
      if (kvStore.isKVAvailable() && memoryStorage.users) {
        try {
          console.log('ユーザーデータをKVに同期中...')
          const success = await kvStore.saveProductionData('users', memoryStorage.users)
          if (success) {
            fixResults.fixed.users = true
            fixResults.summary.issuesFixed++
            fixResults.operations.push('Fixed: Users synced from memory to KV')
          }
        } catch (userFixError) {
          fixResults.operations.push(`User fix error: ${userFixError.message}`)
        }
      }
    }

    // グループデータの不整合
    if (memoryGroupsCount > kvGroupsCount) {
      fixResults.summary.issuesFound++
      fixResults.operations.push(`Issue found: Groups in memory(${memoryGroupsCount}) > KV(${kvGroupsCount})`)
      
      if (kvStore.isKVAvailable() && memoryStorage.groups) {
        try {
          console.log('グループデータをKVに同期中...')
          const success = await kvStore.saveProductionData('groups', memoryStorage.groups)
          if (success) {
            fixResults.fixed.groups = true
            fixResults.summary.issuesFixed++
            fixResults.operations.push('Fixed: Groups synced from memory to KV')
          }
        } catch (groupFixError) {
          fixResults.operations.push(`Group fix error: ${groupFixError.message}`)
        }
      }
    }

    // コースデータの不整合
    if (memoryCourseCount > kvCoursesCount) {
      fixResults.summary.issuesFound++
      fixResults.operations.push(`Issue found: Courses in memory(${memoryCourseCount}) > KV(${kvCoursesCount})`)
      
      if (kvStore.isKVAvailable() && memoryStorage.courses) {
        try {
          console.log('コースデータをKVに同期中...')
          const success = await kvStore.saveProductionData('courses', memoryStorage.courses)
          if (success) {
            fixResults.fixed.courses = true
            fixResults.summary.issuesFixed++
            fixResults.operations.push('Fixed: Courses synced from memory to KV')
          }
        } catch (courseFixError) {
          fixResults.operations.push(`Course fix error: ${courseFixError.message}`)
        }
      }
    }

    // 3. 修復後の確認
    console.log('3. 修復後確認中...')
    if (fixResults.summary.issuesFixed > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒待機
      
      // 再度確認
      try {
        const [verifyUsers, verifyGroups, verifyCourses] = await Promise.all([
          kvStore.getProductionData('users'),
          kvStore.getProductionData('groups'),
          kvStore.getProductionData('courses')
        ])
        
        const newKvUsersCount = verifyUsers ? Object.keys(verifyUsers.users || {}).length : 0
        const newKvGroupsCount = verifyGroups ? Object.keys(verifyGroups.groups || {}).length : 0
        const newKvCoursesCount = verifyCourses ? Object.keys(verifyCourses.courses || {}).length : 0
        
        fixResults.operations.push(`After fix - KV data: users(${newKvUsersCount}), groups(${newKvGroupsCount}), courses(${newKvCoursesCount})`)
        
        if (newKvUsersCount === memoryUsersCount && newKvGroupsCount === memoryGroupsCount && newKvCoursesCount === memoryCourseCount) {
          fixResults.operations.push('✓ All data consistency verified')
        } else {
          fixResults.operations.push('⚠ Some inconsistencies remain after fix')
        }
      } catch (verifyError) {
        fixResults.operations.push(`Verification error: ${verifyError.message}`)
      }
    }

    console.log('=== 自動データ修復完了 ===')

    const wasSuccessful = fixResults.summary.issuesFound === 0 || fixResults.summary.issuesFixed > 0

    return res.json({
      success: true,
      message: wasSuccessful ? '自動修復が完了しました' : '修復可能な問題は見つかりませんでした',
      data: fixResults,
      recommendations: generateFixRecommendations(fixResults)
    })

  } catch (error) {
    console.error('自動データ修復エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Auto data fix failed',
      error: error.message
    })
  }
}

function generateFixRecommendations(fixResults) {
  const recommendations = []
  
  if (fixResults.summary.issuesFound === 0) {
    recommendations.push('データに不整合は検出されませんでした。')
  } else {
    if (fixResults.summary.issuesFixed === fixResults.summary.issuesFound) {
      recommendations.push('すべての問題が修復されました。ブラウザをリロードしてください。')
    } else if (fixResults.summary.issuesFixed > 0) {
      recommendations.push(`${fixResults.summary.issuesFixed}/${fixResults.summary.issuesFound}の問題が修復されました。残りの問題については手動確認が必要です。`)
    } else {
      recommendations.push('問題は検出されましたが修復できませんでした。KV接続を確認してください。')
    }
  }
  
  if (fixResults.fixed.users || fixResults.fixed.groups || fixResults.fixed.courses) {
    recommendations.push('データが同期されました。リロード後も表示されるはずです。')
  }
  
  return recommendations
}