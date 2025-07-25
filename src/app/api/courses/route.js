// App Router用のコース取得エンドポイント
const path = require('path')
const dataStore = require(path.join(process.cwd(), 'lib', 'dataStore'))

export async function GET(request) {
  try {
    // CORS設定
    const headers = {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 認証チェック
    const authHeader = request.headers.get('authorization')
    
    console.log('コース取得API認証チェック:', { 
      hasAuthHeader: !!authHeader,
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1'
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        message: '認証が必要です'
      }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }
    
    const token = authHeader.substring(7)
    
    // 本番環境では簡易的な認証チェック
    if (!token || (token !== 'demo-admin' && !token.startsWith('eyJ'))) {
      return new Response(JSON.stringify({
        success: false,
        message: '有効な認証トークンが必要です'
      }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('✓ 認証成功 - コース一覧取得開始')
    
    // **強制的に最新データを取得（キャッシュ無効化）**
    const courses = await dataStore.getCoursesAsync()
    
    console.log(`コース取得完了: ${courses.length}件`)
    console.log('取得したコース一覧:', courses.map(c => ({ 
      id: c.id, 
      title: c.title,
      createdAt: c.createdAt 
    })))
    
    return new Response(JSON.stringify({
      success: true,
      data: courses,
      count: courses.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        ...headers, 
        'Content-Type': 'application/json',
        // キャッシュを完全に無効化
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('コース取得エラー:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'コース取得に失敗しました',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}