// Supabase接続テスト用エンドポイント
const dataStore = require('../../lib/supabaseDataStore')

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
    console.log('🧪 Supabase接続テスト開始...')
    
    // 各テーブルの基本的な接続テスト
    const tests = []
    
    // 1. コース取得テスト
    try {
      const coursesData = await dataStore.getCourses()
      tests.push({
        name: 'getCourses',
        success: true,
        count: Object.keys(coursesData.courses || {}).length,
        data: coursesData
      })
    } catch (error) {
      tests.push({
        name: 'getCourses',
        success: false,
        error: error.message
      })
    }
    
    // 2. ユーザー取得テスト
    try {
      const usersData = await dataStore.getUsers()
      tests.push({
        name: 'getUsers',
        success: true,
        count: Object.keys(usersData.users || {}).length,
        data: usersData
      })
    } catch (error) {
      tests.push({
        name: 'getUsers',
        success: false,
        error: error.message
      })
    }
    
    // 3. グループ取得テスト
    try {
      const groupsData = await dataStore.getGroups()
      tests.push({
        name: 'getGroups',
        success: true,
        count: Object.keys(groupsData.groups || {}).length,
        data: groupsData
      })
    } catch (error) {
      tests.push({
        name: 'getGroups',
        success: false,
        error: error.message
      })
    }
    
    // 4. 動画取得テスト
    try {
      const videosData = await dataStore.getVideos()
      tests.push({
        name: 'getVideos',
        success: true,
        count: Object.keys(videosData.videos || {}).length,
        data: videosData
      })
    } catch (error) {
      tests.push({
        name: 'getVideos',
        success: false,
        error: error.message
      })
    }
    
    // テスト結果をまとめる
    const successfulTests = tests.filter(t => t.success).length
    const totalTests = tests.length
    
    console.log(`✅ Suパbase接続テスト完了: ${successfulTests}/${totalTests} 成功`)
    
    return res.json({
      success: successfulTests === totalTests,
      message: `Supabase接続テスト完了: ${successfulTests}/${totalTests} 成功`,
      results: {
        totalTests,
        successfulTests,
        failedTests: totalTests - successfulTests,
        tests
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Supabase接続テストエラー:', error)
    return res.status(500).json({
      success: false,
      message: 'Supabase接続テスト中にエラーが発生しました',
      error: error.message,
      stack: error.stack
    })
  }
}

export const config = {
  maxDuration: 30
}