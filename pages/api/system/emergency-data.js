// Emergency data creation endpoint (when KV is not available)
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'POSTメソッドのみサポートされています'
    })
  }
  
  try {
    console.log('🚨 緊急データ作成開始')
    
    // 環境チェック
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN
    }
    
    console.log('環境情報:', environment)
    
    // 緊急時の固定データ（メモリ内グローバル変数として設定）
    const emergencyData = {
      courses: {
        "1": {
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
                {
                  id: 1,
                  title: "HTML入門",
                  description: "HTMLとは何か",
                  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                  curriculumId: 1,
                  duration: 596,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                {
                  id: 2,
                  title: "基本タグ",
                  description: "よく使うHTMLタグ",
                  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                  curriculumId: 1,
                  duration: 653,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ]
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "2": {
          id: 2,
          title: "テストコース",
          description: "テスト用のコースです",
          thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
          curriculums: [
            {
              id: 2,
              title: "基礎編",
              description: "基本的な概念を学びます",
              courseId: 2,
              videos: [
                {
                  id: 4,
                  title: "概要説明",
                  description: "コースの概要について",
                  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                  curriculumId: 2,
                  duration: 15,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ]
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "3": {
          id: 3,
          title: "プログラミング基礎",
          description: "プログラミングの基本概念を学ぶコース",
          thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
          curriculums: [
            {
              id: 3,
              title: "プログラミング入門",
              description: "プログラミングの基本的な考え方",
              courseId: 3,
              videos: [
                {
                  id: 5,
                  title: "プログラミングとは",
                  description: "プログラミングの基本概念",
                  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                  curriculumId: 3,
                  duration: 15,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                {
                  id: 6,
                  title: "変数と演算",
                  description: "変数の使い方と計算",
                  videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                  curriculumId: 3,
                  duration: 15,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              ]
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      nextCourseId: 4,
      nextCurriculumId: 4,
      nextVideoId: 7
    }
    
    // グローバル変数として設定（Vercel関数の制限内）
    if (typeof global !== 'undefined') {
      global.EMERGENCY_COURSES_DATA = emergencyData
      global.EMERGENCY_USERS_DATA = {
        users: {
          "1": {
            id: 1,
            email: "admin@example.com",
            name: "管理者",
            role: "ADMIN",
            group: "管理者",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          "2": {
            id: 2,
            email: "user@example.com",
            name: "テストユーザー",
            role: "USER",
            group: "一般",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        nextUserId: 3
      }
      global.EMERGENCY_GROUPS_DATA = {
        groups: {
          "1": {
            id: 1,
            name: "管理者グループ",
            code: "ADMIN_GROUP",
            description: "システム管理者用のグループ",
            courseIds: [1, 2, 3],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          "2": {
            id: 2,
            name: "新入社員研修グループA",
            code: "NEWBIE2024",
            description: "2024年度新入社員向けの基礎研修グループ",
            courseIds: [1, 2],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        nextGroupId: 3
      }
      global.EMERGENCY_LOGS_DATA = {
        logs: {},
        nextLogId: 1
      }
      
      console.log('✅ 緊急データをグローバル変数に設定完了')
    }
    
    return res.json({
      success: true,
      message: '緊急データ作成完了',
      data: {
        courses: Object.keys(emergencyData.courses).length,
        users: 2,
        groups: 2,
        videos: 6,
        method: 'global-variables',
        environment
      },
      instructions: [
        'グローバル変数として緊急データを設定しました',
        'KVが利用できない間の一時的な対応です',
        'APIエンドポイントはこのデータを参照します',
        'Vercel関数の再起動まで有効です'
      ]
    })
    
  } catch (error) {
    console.error('❌ 緊急データ作成エラー:', error)
    return res.status(500).json({
      success: false,
      message: '緊急データ作成中にエラーが発生しました',
      error: error.message
    })
  }
}

export const config = {
  maxDuration: 30
}