// Group progress endpoint

// デモ進捗データ
function generateMockProgressData(groupId) {
  // グループデータを取得
  const group = {
    id: groupId,
    name: groupId === 1 ? '管理グループ' : groupId === 2 ? '開発チーム' : '営業チーム',
    code: groupId === 1 ? 'ADMIN001' : groupId === 2 ? 'DEV001' : 'SALES001',
    description: `${groupId === 1 ? '管理者' : groupId === 2 ? '開発チーム' : '営業チーム'}グループ`
  }
  
  // コースデータ
  const courses = [
    {
      id: 1,
      title: "ウェブ開発入門",
      description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
      curriculums: [
        {
          id: 1,
          title: "HTML基礎",
          description: "HTMLの基本構文と要素",
          courseId: 1,
          videos: [
            { id: 1, title: "HTML入門", description: "HTMLとは何か" },
            { id: 2, title: "基本タグ", description: "よく使うHTMLタグ" }
          ]
        }
      ]
    },
    {
      id: 2,
      title: "データベース設計",
      description: "SQL、NoSQLの基礎とデータベース設計の実践的な学習",
      thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
      curriculums: [
        {
          id: 2,
          title: "SQL基礎",
          description: "SQLの基本構文",
          courseId: 2,
          videos: [
            { id: 3, title: "SELECT文", description: "データの抽出" },
            { id: 4, title: "INSERT文", description: "データの挿入" }
          ]
        }
      ]
    }
  ]
  
  // メンバーデータ（グループによって異なる）
  let members = []
  if (groupId === 1) {
    members = [
      {
        user: {
          id: 1,
          name: '管理者ユーザー',
          email: 'admin@test.com',
          role: 'ADMIN',
          isFirstLogin: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        progress: {
          totalVideos: 4,
          watchedVideos: 4,
          completedVideos: 4,
          completionRate: 100,
          watchRate: 100
        }
      }
    ]
  } else if (groupId === 2) {
    members = [
      {
        user: {
          id: 2,
          name: '開発者A',
          email: 'dev1@test.com',
          role: 'USER',
          isFirstLogin: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        progress: {
          totalVideos: 4,
          watchedVideos: 3,
          completedVideos: 2,
          completionRate: 50,
          watchRate: 75
        }
      },
      {
        user: {
          id: 3,
          name: '開発者B',
          email: 'dev2@test.com',
          role: 'USER',
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        progress: {
          totalVideos: 4,
          watchedVideos: 1,
          completedVideos: 0,
          completionRate: 0,
          watchRate: 25
        }
      }
    ]
  } else {
    members = [
      {
        user: {
          id: 4,
          name: '営業担当A',
          email: 'sales1@test.com',
          role: 'USER',
          isFirstLogin: false,
          lastLoginAt: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        progress: {
          totalVideos: 4,
          watchedVideos: 2,
          completedVideos: 1,
          completionRate: 25,
          watchRate: 50
        }
      },
      {
        user: {
          id: 5,
          name: '営業担当B',
          email: 'sales2@test.com',
          role: 'USER',
          isFirstLogin: true,
          lastLoginAt: null,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        progress: {
          totalVideos: 4,
          watchedVideos: 0,
          completedVideos: 0,
          completionRate: 0,
          watchRate: 0
        }
      }
    ]
  }
  
  return {
    group,
    courses,
    members
  }
}

export default function handler(req, res) {
  const { id } = req.query
  const groupId = parseInt(id)
  
  console.log(`グループ進捗API呼び出し: ID=${id}, 解析後ID=${groupId}`)
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received for group progress')
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // リクエストヘッダーのログ
    console.log('Request headers:', {
      authorization: req.headers.authorization,
      'user-agent': req.headers['user-agent']
    })
    
    // グループIDの妥当性チェック
    if (isNaN(groupId)) {
      console.log(`無効なグループID: ${id}`)
      return res.status(400).json({
        success: false,
        message: '無効なグループIDです'
      })
    }
    
    if (groupId < 1 || groupId > 3) {
      console.log(`範囲外のグループID: ${groupId}`)
      return res.status(404).json({
        success: false,
        message: 'グループが見つかりません'
      })
    }
    
    try {
      // モックデータを生成
      const progressData = generateMockProgressData(groupId)
      
      console.log(`グループ進捗データ生成成功: ${progressData.group.name}`)
      console.log(`メンバー数: ${progressData.members.length}`)
      console.log(`コース数: ${progressData.courses.length}`)
      
      return res.status(200).json({
        success: true,
        data: progressData,
        message: 'グループ進捗データを正常に取得しました'
      })
    } catch (error) {
      console.error('グループ進捗データ生成エラー:', error)
      return res.status(500).json({
        success: false,
        message: 'サーバー内部エラーが発生しました',
        error: error.message
      })
    }
  }
  
  console.log(`サポートされていないメソッド: ${req.method}`)
  return res.status(405).json({ 
    success: false,
    message: 'Method not allowed' 
  })
}