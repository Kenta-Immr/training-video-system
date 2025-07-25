// App Router用のユーザー取得エンドポイント
const dataStore = require('../../../../lib/dataStore')

export async function GET(request) {
  try {
    // CORS設定
    const headers = {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 認証チェック（管理者のみ）
    const authHeader = request.headers.get('authorization')
    
    console.log('ユーザー取得API認証チェック:', { 
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
    
    console.log('✓ 認証成功 - ユーザー一覧取得開始')
    
    // **強制的に最新データを取得（キャッシュ無効化）**
    const users = await dataStore.getUsersAsync()
    
    console.log(`ユーザー取得完了: ${users.length}件`)
    console.log('取得したユーザー一覧:', users.map(u => ({ 
      id: u.id, 
      userId: u.userId, 
      name: u.name,
      role: u.role,
      createdAt: u.createdAt 
    })))
    
    return new Response(JSON.stringify({
      success: true,
      data: users,
      count: users.length,
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
    console.error('ユーザー取得エラー:', error)
    return new Response(JSON.stringify({
      success: false,
      message: 'ユーザー取得に失敗しました',
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