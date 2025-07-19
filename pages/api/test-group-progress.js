// テスト用のシンプルなグループ進捗API

export default function handler(req, res) {
  console.log('テスト用グループ進捗API呼び出し')
  console.log('Method:', req.method)
  console.log('Query:', req.query)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    const testData = {
      group: {
        id: 1,
        name: 'テストグループ',
        code: 'TEST001',
        description: 'テスト用のグループです'
      },
      courses: [
        {
          id: 1,
          title: 'テストコース',
          description: 'テスト用のコース',
          curriculums: [
            {
              id: 1,
              title: 'テストカリキュラム',
              videos: [
                { id: 1, title: 'テスト動画1' },
                { id: 2, title: 'テスト動画2' }
              ]
            }
          ]
        }
      ],
      members: [
        {
          user: {
            id: 1,
            name: 'テストユーザー',
            email: 'test@example.com',
            role: 'USER',
            isFirstLogin: false,
            lastLoginAt: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          progress: {
            totalVideos: 2,
            watchedVideos: 1,
            completedVideos: 1,
            completionRate: 50,
            watchRate: 50
          }
        }
      ]
    }
    
    console.log('テストデータ送信:', testData)
    
    return res.status(200).json({
      success: true,
      data: testData,
      message: 'テストデータを正常に取得しました'
    })
  }
  
  return res.status(405).json({
    success: false,
    message: 'Method not allowed'
  })
}