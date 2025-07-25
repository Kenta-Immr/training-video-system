// Production data initialization endpoint
const dataStore = require('../../../lib/dataStore')

export default async function handler(req, res) {
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
    console.log('🚀 本番環境データ初期化開始')
    
    // 環境チェック
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    console.log('環境:', { 
      nodeEnv: process.env.NODE_ENV, 
      vercel: process.env.VERCEL,
      isProduction 
    })
    
    // 基本コースデータの作成
    const defaultCourses = {
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
    
    // 基本ユーザーデータの作成
    const defaultUsers = {
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
    
    // 基本グループデータの作成
    const defaultGroups = {
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
    
    // 空のログデータ
    const defaultLogs = {
      logs: {},
      nextLogId: 1
    }
    
    // 空のインストラクターデータ
    const defaultInstructors = {
      instructors: {},
      nextInstructorId: 1
    }
    
    console.log('📊 デフォルトデータ準備完了')
    
    // KVまたはファイルシステムに保存
    if (dataStore.saveCoursesData) {
      await dataStore.saveCoursesData(defaultCourses)
      console.log('✅ コースデータ保存完了')
    }
    
    if (dataStore.saveUsersData) {
      await dataStore.saveUsersData(defaultUsers)
      console.log('✅ ユーザーデータ保存完了')
    }
    
    if (dataStore.saveGroupsData) {
      await dataStore.saveGroupsData(defaultGroups)
      console.log('✅ グループデータ保存完了')
    }
    
    if (dataStore.saveLogsData) {
      await dataStore.saveLogsData(defaultLogs)
      console.log('✅ ログデータ保存完了')
    }
    
    if (dataStore.saveInstructorsData) {
      await dataStore.saveInstructorsData(defaultInstructors)
      console.log('✅ インストラクターデータ保存完了')
    }
    
    // 初期化確認
    const verifyData = {
      courses: dataStore.loadCoursesData(),
      users: dataStore.loadUsersData(),
      groups: dataStore.loadGroupsData()
    }
    
    console.log('🔍 データ初期化確認:', {
      coursesCount: Object.keys(verifyData.courses?.courses || {}).length,
      usersCount: Object.keys(verifyData.users?.users || {}).length,
      groupsCount: Object.keys(verifyData.groups?.groups || {}).length
    })
    
    return res.json({
      success: true,
      message: '本番環境データ初期化完了',
      data: {
        courses: Object.keys(verifyData.courses?.courses || {}).length,
        users: Object.keys(verifyData.users?.users || {}).length,
        groups: Object.keys(verifyData.groups?.groups || {}).length,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL,
          kvAvailable: dataStore.isKVAvailable ? dataStore.isKVAvailable() : false
        }
      }
    })
    
  } catch (error) {
    console.error('❌ 本番環境データ初期化エラー:', error)
    return res.status(500).json({
      success: false,
      message: '初期化中にエラーが発生しました',
      error: error.message
    })
  }
}

export const config = {
  maxDuration: 60
}