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
    
    // 各データタイプに個別のコースを作成する
    console.log('📝 個別コース作成開始')
    
    // コース1: ウェブ開発入門
    const course1 = dataStore.createCourse({
      title: "ウェブ開発入門",
      description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
      thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
    })
    console.log('✅ コース1作成:', course1?.title)
    
    // コース2: テストコース
    const course2 = dataStore.createCourse({
      title: "テストコース", 
      description: "テスト用のコースです",
      thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"
    })
    console.log('✅ コース2作成:', course2?.title)
    
    // コース3: プログラミング基礎
    const course3 = dataStore.createCourse({
      title: "プログラミング基礎",
      description: "プログラミングの基本概念を学ぶコース", 
      thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"
    })
    console.log('✅ コース3作成:', course3?.title)
    
    // 動画の作成
    console.log('🎥 動画作成開始')
    try {
      // コース1の動画
      if (course1) {
        const video1 = dataStore.createVideo({
          title: "HTML入門",
          description: "HTMLとは何か",
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          curriculumId: 1 // 仮のカリキュラムID
        })
        console.log('✅ 動画1作成:', video1?.title)
        
        const video2 = dataStore.createVideo({
          title: "基本タグ", 
          description: "よく使うHTMLタグ",
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          curriculumId: 1
        })
        console.log('✅ 動画2作成:', video2?.title)
      }
      
      // コース2の動画
      if (course2) {
        const video3 = dataStore.createVideo({
          title: "概要説明",
          description: "コースの概要について", 
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          curriculumId: 2
        })
        console.log('✅ 動画3作成:', video3?.title)
      }
      
      // コース3の動画
      if (course3) {
        const video4 = dataStore.createVideo({
          title: "プログラミングとは",
          description: "プログラミングの基本概念",
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 
          curriculumId: 3
        })
        console.log('✅ 動画4作成:', video4?.title)
        
        const video5 = dataStore.createVideo({
          title: "変数と演算",
          description: "変数の使い方と計算",
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          curriculumId: 3
        })
        console.log('✅ 動画5作成:', video5?.title)
      }
    } catch (error) {
      console.log('⚠️ 動画作成エラー:', error.message)
    }
    
    // 基本ユーザーの作成
    try {
      const admin = dataStore.createUser({
        email: "admin@example.com",
        name: "管理者", 
        role: "ADMIN",
        group: "管理者"
      })
      console.log('✅ 管理者ユーザー作成:', admin?.name)
      
      const user = dataStore.createUser({
        email: "user@example.com",
        name: "テストユーザー",
        role: "USER", 
        group: "一般"
      })
      console.log('✅ テストユーザー作成:', user?.name)
    } catch (error) {
      console.log('⚠️ ユーザー作成エラー（既に存在する可能性）:', error.message)
    }
    
    // 基本グループの作成
    try {
      const group1 = dataStore.createGroup({
        name: "管理者グループ",
        code: "ADMIN_GROUP", 
        description: "システム管理者用のグループ"
      })
      console.log('✅ 管理者グループ作成:', group1?.name)
      
      const group2 = dataStore.createGroup({
        name: "新入社員研修グループA",
        code: "NEWBIE2024",
        description: "2024年度新入社員向けの基礎研修グループ"
      })
      console.log('✅ 研修グループ作成:', group2?.name)
    } catch (error) {
      console.log('⚠️ グループ作成エラー（既に存在する可能性）:', error.message)
    }
    
    // 初期化確認
    console.log('🔍 初期化データ確認中...')
    const courses = dataStore.getCourses()
    const users = dataStore.getUsers() 
    const groups = dataStore.getGroups()
    
    const verifyData = {
      courses: courses,
      users: users,
      groups: groups
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