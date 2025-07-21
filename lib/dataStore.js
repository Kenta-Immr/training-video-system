const fs = require('fs')
const path = require('path')

// KVストア（本番環境用）
let kvStore = null
let useKV = false

try {
  // 本番環境でのみKVストアを読み込み
  if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_URL) {
    kvStore = require('./kvStore')
    useKV = kvStore && kvStore.isKVAvailable && kvStore.isKVAvailable()
  }
} catch (error) {
  console.log('KVストア読み込みスキップ:', error.message)
  useKV = false
}

// 環境に応じたデータストレージの設定（ホットリロード対応済み）
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production'

console.log('データストア設定:', {
  isVercel,
  useKV,
  kvAvailable: !!kvStore,
  nodeEnv: process.env.NODE_ENV,
  hasKVUrl: !!process.env.KV_REST_API_URL,
  hasKVToken: !!process.env.KV_REST_API_TOKEN
})

// データファイルのパス（Vercelでは/tmp使用）
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data')
const COURSES_FILE = path.join(DATA_DIR, 'courses.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')
const INSTRUCTORS_FILE = path.join(DATA_DIR, 'instructors.json')

console.log('データストア初期化:', {
  isVercel,
  dataDir: DATA_DIR,
  nodeEnv: process.env.NODE_ENV
})

// データディレクトリが存在しない場合は作成（ローカル環境のみ）
if (!isVercel && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// グローバルメモリストレージ（Vercelでの永続化対策）
if (!global.persistentStorage) {
  console.log('グローバルストレージを初期化中...')
  global.persistentStorage = {
    courses: null,
    users: null,
    groups: null,
    logs: null,
    instructors: null,
    initialized: false,
    initializationPromise: null,
    hotReloadCount: 0
  }
} else {
  // ホットリロード検出
  global.persistentStorage.hotReloadCount = (global.persistentStorage.hotReloadCount || 0) + 1
  console.log(`ホットリロード検出 #${global.persistentStorage.hotReloadCount}: 既存データを保持`)
}

// Vercel環境でのメモリベースストレージのフォールバック
let memoryStorage = global.persistentStorage

console.log('メモリストレージ状態:', {
  initialized: memoryStorage.initialized,
  hasCourses: !!memoryStorage.courses,
  hasUsers: !!memoryStorage.users,
  hasGroups: !!memoryStorage.groups,
  hasLogs: !!memoryStorage.logs,
  hasInstructors: !!memoryStorage.instructors
})

// 初期化処理（ホットリロード対応）
async function ensureDataInitialized() {
  // 強制的にファイルからデータを読み込む（ホットリロード対応）
  console.log('データ初期化強制実行: ファイルからデータを再読み込み')
  
  // 既に初期化処理中の場合は待機
  if (memoryStorage.initializationPromise) {
    await memoryStorage.initializationPromise
    return
  }
  
  // 初期化処理を開始
  memoryStorage.initializationPromise = initializeAllData()
  await memoryStorage.initializationPromise
  memoryStorage.initialized = true
  memoryStorage.initializationPromise = null
  
  console.log('データストア初期化完了')
}

async function initializeAllData() {
  console.log('全データの初期化開始')
  
  // すべてのデータを並行して初期化
  if (!memoryStorage.users) {
    loadUsersData()
  }
  if (!memoryStorage.courses) {
    loadCoursesData()
  }
  if (!memoryStorage.groups) {
    loadGroupsData()
  }
  if (!memoryStorage.logs) {
    loadLogsData()
  }
  if (!memoryStorage.instructors) {
    loadInstructorsData()
  }
  
  console.log('全データの初期化完了')
}

// デフォルトデータ
const DEFAULT_COURSES_DATA = {
  courses: {
    1: {
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
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z"
            },
            {
              id: 2,
              title: "基本タグ",
              description: "よく使うHTMLタグ",
              videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
              curriculumId: 1,
              duration: 653,
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z"
            }
          ]
        }
      ],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nextCourseId: 2,
  nextCurriculumId: 2,
  nextVideoId: 3
}

const DEFAULT_USERS_DATA = {
  users: {
    1: {
      id: 1,
      email: "admin@example.com",
      name: "管理者",
      role: "ADMIN",
      groupId: null,
      isFirstLogin: false,
      lastLoginAt: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    2: {
      id: 2,
      email: "user@example.com",
      name: "一般ユーザー",
      role: "USER",
      groupId: 1,
      isFirstLogin: false,
      lastLoginAt: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nextUserId: 3
}

const DEFAULT_GROUPS_DATA = {
  groups: {
    1: {
      id: 1,
      name: "開発チーム",
      code: "DEV001",
      description: "開発部門のメンバー",
      courseIds: [1],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nextGroupId: 2
}

const DEFAULT_LOGS_DATA = {
  viewingLogs: {
    1: {
      id: 1,
      userId: 2,
      videoId: 1,
      watchedSeconds: 300,
      totalDuration: 596,
      isCompleted: false,
      lastWatchedAt: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nextLogId: 2
}

const DEFAULT_INSTRUCTORS_DATA = {
  instructors: {
    1: {
      id: 1,
      name: "田中太郎",
      email: "tanaka@example.com",
      bio: "ウェブ開発歴10年のエキスパート講師",
      expertise: ["JavaScript", "React", "Node.js"],
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  nextInstructorId: 2
}

// 同期版データ読み込み（高速）
function loadCoursesDataSync() {
  try {
    console.log('コースデータ同期読み込み開始')
    
    // メモリから読み込み
    if (memoryStorage.courses) {
      return memoryStorage.courses
    }
    
    // ファイルから読み込み（開発環境のみ）
    if (!isVercel && fs.existsSync(COURSES_FILE)) {
      const data = fs.readFileSync(COURSES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      memoryStorage.courses = parsed
      return parsed
    }
    
    // デフォルトデータ
    const defaultData = {
      courses: {},
      nextCourseId: 1,
      nextCurriculumId: 1,
      nextVideoId: 1
    }
    memoryStorage.courses = defaultData
    return defaultData
  } catch (error) {
    console.error('同期読み込みエラー:', error)
    const emergencyData = {
      courses: {},
      nextCourseId: 1,
      nextCurriculumId: 1,
      nextVideoId: 1
    }
    memoryStorage.courses = emergencyData
    return emergencyData
  }
}

// 非同期版データ読み込み（本番：KV、開発：ファイル）
async function loadCoursesData() {
  try {
    console.log('コースデータ読み込み開始:', {
      isVercel,
      useKV,
      hasMemoryData: !!memoryStorage.courses,
      fileExists: !isVercel && fs.existsSync(COURSES_FILE)
    })
    
    // 本番環境ではKVから読み込み
    if (useKV) {
      console.log('KVからコースデータ取得中...')
      const kvData = await kvStore.getProductionData('courses')
      if (kvData) {
        console.log(`KVからコースデータ読み込み成功: ${Object.keys(kvData.courses || {}).length}件`)
        memoryStorage.courses = kvData
        return kvData
      }
    }
    
    // ファイルから読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(COURSES_FILE)) {
      const data = fs.readFileSync(COURSES_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      // データ構造の検証
      if (!parsed.courses) {
        console.log('コースデータ構造が不正です。既存データを保持してマージします。')
        const fixedData = {
          courses: {},
          nextCourseId: 1,
          nextCurriculumId: 1,
          nextVideoId: 1,
          ...parsed
        }
        // メモリとファイルの両方に保存
        memoryStorage.courses = fixedData
        await saveCoursesData(fixedData)
        return fixedData
      }
      
      console.log(`ファイルからコースデータ読み込み成功: ${Object.keys(parsed.courses).length}件`)
      // メモリストレージにも保存
      memoryStorage.courses = parsed
      return parsed
    }
    
    // メモリストレージから確認（ファイルが無い場合）
    if (memoryStorage.courses && memoryStorage.courses.courses && typeof memoryStorage.courses.courses === 'object') {
      console.log('メモリからコースデータ取得:', Object.keys(memoryStorage.courses.courses).length, '件')
      return memoryStorage.courses
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトコースデータで初期化')
    let defaultData
    if (isVercel) {
      // Vercel環境では最小限のデータで開始
      defaultData = {
        courses: {},
        nextCourseId: 1,
        nextCurriculumId: 1,
        nextVideoId: 1
      }
    } else {
      defaultData = DEFAULT_COURSES_DATA
    }
    
    memoryStorage.courses = defaultData
    if (!isVercel) {
      saveCoursesData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('コースデータの読み込みエラー:', error)
    
    // 緊急復旧
    const emergencyData = {
      courses: {},
      nextCourseId: 1,
      nextCurriculumId: 1,
      nextVideoId: 1
    }
    
    memoryStorage.courses = emergencyData
    console.log('緊急復旧: 空のコースデータで初期化')
    return emergencyData
  }
}

// 同期版ユーザーデータ読み込み
function loadUsersDataSync() {
  try {
    console.log('ユーザーデータ同期読み込み開始')
    
    // メモリから読み込み
    if (memoryStorage.users) {
      return memoryStorage.users
    }
    
    // ファイルから読み込み（開発環境のみ）
    if (!isVercel && fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      memoryStorage.users = parsed
      return parsed
    }
    
    // デフォルトデータ
    const defaultData = {
      users: {},
      nextUserId: 1
    }
    memoryStorage.users = defaultData
    return defaultData
  } catch (error) {
    console.error('同期読み込みエラー:', error)
    const emergencyData = {
      users: {},
      nextUserId: 1
    }
    memoryStorage.users = emergencyData
    return emergencyData
  }
}

// 非同期版ユーザーデータ読み込み
async function loadUsersData() {
  try {
    console.log('ユーザーデータ読み込み開始:', {
      isVercel,
      useKV,
      hasMemoryData: !!memoryStorage.users,
      fileExists: !isVercel && fs.existsSync(USERS_FILE)
    })
    
    // 本番環境ではKVから読み込み
    if (useKV) {
      console.log('KVからユーザーデータ取得中...')
      const kvData = await kvStore.getProductionData('users')
      if (kvData) {
        console.log(`KVからユーザーデータ読み込み成功: ${Object.keys(kvData.users || {}).length}件`)
        memoryStorage.users = kvData
        return kvData
      }
    }
    
    // ファイルから読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルからユーザーデータ読み込み成功: ${Object.keys(parsed.users || {}).length}件`)
      memoryStorage.users = parsed
      return parsed
    }
    
    // メモリストレージから確認
    if (memoryStorage.users && memoryStorage.users.users && typeof memoryStorage.users.users === 'object') {
      console.log('メモリからユーザーデータ取得:', Object.keys(memoryStorage.users.users).length, '件')
      return memoryStorage.users
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトユーザーデータで初期化')
    let defaultData
    if (isVercel) {
      defaultData = {
        users: {},
        nextUserId: 1
      }
    } else {
      defaultData = DEFAULT_USERS_DATA
    }
    
    memoryStorage.users = defaultData
    if (!isVercel) {
      saveUsersData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('ユーザーデータの読み込みエラー:', error)
    
    const emergencyData = {
      users: {},
      nextUserId: 1
    }
    
    memoryStorage.users = emergencyData
    console.log('緊急復旧: 空のユーザーデータで初期化')
    return emergencyData
  }
}

// 同期版グループデータ読み込み
function loadGroupsDataSync() {
  try {
    console.log('グループデータ同期読み込み開始')
    
    // メモリから読み込み
    if (memoryStorage.groups) {
      return memoryStorage.groups
    }
    
    // ファイルから読み込み（開発環境のみ）
    if (!isVercel && fs.existsSync(GROUPS_FILE)) {
      const data = fs.readFileSync(GROUPS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      memoryStorage.groups = parsed
      return parsed
    }
    
    // デフォルトデータ
    const defaultData = {
      groups: {},
      nextGroupId: 1
    }
    memoryStorage.groups = defaultData
    return defaultData
  } catch (error) {
    console.error('同期読み込みエラー:', error)
    const emergencyData = {
      groups: {},
      nextGroupId: 1
    }
    memoryStorage.groups = emergencyData
    return emergencyData
  }
}

// 非同期版グループデータ読み込み
async function loadGroupsData() {
  try {
    console.log('グループデータ読み込み開始:', {
      isVercel,
      useKV,
      hasMemoryData: !!memoryStorage.groups,
      fileExists: !isVercel && fs.existsSync(GROUPS_FILE)
    })
    
    // 本番環境ではKVから読み込み
    if (useKV) {
      console.log('KVからグループデータ取得中...')
      const kvData = await kvStore.getProductionData('groups')
      if (kvData) {
        console.log(`KVからグループデータ読み込み成功: ${Object.keys(kvData.groups || {}).length}件`)
        memoryStorage.groups = kvData
        return kvData
      }
    }
    
    // ファイルから読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(GROUPS_FILE)) {
      const data = fs.readFileSync(GROUPS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルからグループデータ読み込み成功: ${Object.keys(parsed.groups || {}).length}件`)
      memoryStorage.groups = parsed
      return parsed
    }
    
    // メモリストレージから確認
    if (memoryStorage.groups && memoryStorage.groups.groups && typeof memoryStorage.groups.groups === 'object') {
      console.log('メモリからグループデータ取得:', Object.keys(memoryStorage.groups.groups).length, '件')
      return memoryStorage.groups
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトグループデータで初期化')
    let defaultData
    if (isVercel) {
      defaultData = {
        groups: {},
        nextGroupId: 1
      }
    } else {
      defaultData = DEFAULT_GROUPS_DATA
    }
    
    memoryStorage.groups = defaultData
    if (!isVercel) {
      saveGroupsData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('グループデータの読み込みエラー:', error)
    
    const emergencyData = {
      groups: {},
      nextGroupId: 1
    }
    
    memoryStorage.groups = emergencyData
    console.log('緊急復旧: 空のグループデータで初期化')
    return emergencyData
  }
}

function loadLogsData() {
  try {
    console.log('ログデータ読み込み開始:', {
      isVercel,
      hasMemoryData: !!memoryStorage.logs,
      fileExists: !isVercel && fs.existsSync(LOGS_FILE)
    })
    
    // ファイルから最初に読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルからログデータ読み込み成功: ${Object.keys(parsed.viewingLogs || {}).length}件`)
      // メモリストレージにも保存
      memoryStorage.logs = parsed
      return parsed
    }
    
    // メモリストレージから確認（ファイルが無い場合）
    if (memoryStorage.logs) {
      console.log('メモリからログデータ取得:', Object.keys(memoryStorage.logs.viewingLogs || {}).length, '件')
      return memoryStorage.logs
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトログデータで初期化')
    let defaultData = DEFAULT_LOGS_DATA
    
    memoryStorage.logs = defaultData
    if (!isVercel) {
      saveLogsData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('ログデータの読み込みエラー:', error)
    
    // 緊急復旧
    const emergencyData = {
      viewingLogs: {},
      nextLogId: 1
    }
    
    memoryStorage.logs = emergencyData
    console.log('緊急復旧: 空のログデータで初期化')
    return emergencyData
  }
}

function loadInstructorsData() {
  try {
    console.log('講師データ読み込み開始:', {
      isVercel,
      hasMemoryData: !!memoryStorage.instructors,
      fileExists: !isVercel && fs.existsSync(INSTRUCTORS_FILE)
    })
    
    // ファイルから最初に読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(INSTRUCTORS_FILE)) {
      const data = fs.readFileSync(INSTRUCTORS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルから講師データ読み込み成功: ${Object.keys(parsed.instructors || {}).length}件`)
      // メモリストレージにも保存
      memoryStorage.instructors = parsed
      return parsed
    }
    
    // メモリストレージから確認（ファイルが無い場合）
    if (memoryStorage.instructors) {
      console.log('メモリから講師データ取得:', Object.keys(memoryStorage.instructors.instructors || {}).length, '件')
      return memoryStorage.instructors
    }
    
    // デフォルトデータで初期化
    console.log('デフォルト講師データで初期化')
    let defaultData = DEFAULT_INSTRUCTORS_DATA
    
    memoryStorage.instructors = defaultData
    if (!isVercel) {
      saveInstructorsData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('講師データの読み込みエラー:', error)
    
    // 緊急復旧
    const emergencyData = {
      instructors: {},
      nextInstructorId: 1
    }
    
    memoryStorage.instructors = emergencyData
    console.log('緊急復旧: 空の講師データで初期化')
    return emergencyData
  }
}

// 各データファイルの保存（同期版）
function saveCoursesDataSync(data) {
  try {
    // データの整合性チェック
    if (!data || !data.courses) {
      console.error('保存しようとするデータが不正です:', data)
      throw new Error('Invalid data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.courses = JSON.parse(JSON.stringify(data))
    console.log(`メモリにコースデータを保存: ${Object.keys(data.courses).length}件`)
    
    // ファイルストレージに保存（ローカル環境のみ）
    if (!isVercel) {
      try {
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(COURSES_FILE, jsonString, 'utf8')
        console.log(`ファイルにコースデータを保存: ${COURSES_FILE}`)
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    }
    
    // 本番環境の場合は、非同期でKVに保存（バックグラウンド）
    if (useKV) {
      setImmediate(async () => {
        try {
          await kvStore.saveProductionData('courses', data)
          console.log('KVに非同期でデータ保存完了')
        } catch (kvError) {
          console.warn('KV非同期保存エラー:', kvError.message)
        }
      })
    }
    
  } catch (error) {
    console.error('コースデータの保存エラー:', error)
    throw error
  }
}

// 各データファイルの保存（非同期版・確実性向上）
async function saveCoursesData(data) {
  console.log('=== コースデータ保存開始 ===')
  const startTime = Date.now()
  
  try {
    // データの整合性チェック
    if (!data || !data.courses) {
      console.error('保存しようとするデータが不正です:', data)
      throw new Error('Invalid data structure')
    }
    
    console.log('データ整合性チェック完了:', {
      courses: Object.keys(data.courses).length,
      nextCourseId: data.nextCourseId,
      dataSize: JSON.stringify(data).length
    })
    
    // ステップ1: メモリストレージに保存（必須）
    memoryStorage.courses = JSON.parse(JSON.stringify(data))
    console.log(`✓ ステップ1: メモリにコースデータを保存: ${Object.keys(data.courses).length}件`)
    
    // ステップ2: KVストアに保存（本番環境）
    let kvSaveSuccess = false
    if (useKV) {
      console.log('ステップ2: KVにコースデータ保存開始...')
      try {
        // KV初期化確認
        await kvStore.initializeKV()
        
        const success = await kvStore.saveProductionData('courses', data)
        if (success) {
          kvSaveSuccess = true
          console.log(`✓ ステップ2: KVにコースデータ保存成功: ${Object.keys(data.courses).length}件`)
          
          // 保存確認
          const verifyData = await kvStore.getProductionData('courses')
          if (verifyData && verifyData.courses && Object.keys(verifyData.courses).length === Object.keys(data.courses).length) {
            console.log('✓ KV保存確認: データ整合性確認済み')
          } else {
            console.error('✗ KV保存確認: データ整合性エラー')
            kvSaveSuccess = false
          }
        } else {
          console.error('✗ ステップ2: KVへの保存に失敗')
        }
      } catch (kvError) {
        console.error('✗ ステップ2: KV保存中にエラー:', kvError.message)
        kvSaveSuccess = false
      }
    } else if (isVercel) {
      console.warn('⚠ ステップ2: KVが利用できません - メモリのみで動作')
    }
    
    // ステップ3: ファイル保存（開発環境のみ）
    if (!isVercel) {
      try {
        const backupFile = COURSES_FILE + '.backup'
        if (fs.existsSync(COURSES_FILE)) {
          fs.copyFileSync(COURSES_FILE, backupFile)
        }
        
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(COURSES_FILE, jsonString, 'utf8')
        console.log(`✓ ステップ3: ファイルにコースデータを保存: ${COURSES_FILE}`)
        
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile)
        }
      } catch (fileError) {
        console.warn('⚠ ステップ3: ファイル保存失敗:', fileError.message)
      }
    }
    
    const endTime = Date.now()
    console.log(`=== コースデータ保存完了 (${endTime - startTime}ms) ===`, {
      memory: true,
      kv: kvSaveSuccess,
      file: !isVercel,
      totalCourses: Object.keys(data.courses).length
    })
    
    return { success: true, kvSaved: kvSaveSuccess, memorySaved: true }
    
  } catch (error) {
    console.error('=== コースデータ保存エラー ===', error)
    throw error
  }
}

function saveUsersData(data) {
  try {
    // データの整合性チェック
    if (!data || !data.users) {
      console.error('保存しようとするユーザーデータが不正です:', data)
      throw new Error('Invalid user data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.users = JSON.parse(JSON.stringify(data))
    console.log(`メモリにユーザーデータを保存: ${Object.keys(data.users).length}件`)
    
    // 本番環境の場合は、非同期でKVに保存（バックグラウンド）
    if (useKV) {
      setImmediate(async () => {
        try {
          await kvStore.saveProductionData('users', data)
          console.log('KVにユーザーデータ非同期保存完了')
        } catch (kvError) {
          console.warn('KVユーザーデータ非同期保存エラー:', kvError.message)
        }
      })
    }
    
    // ファイルストレージに保存（ローカル環境のみ、エラーは無視）
    if (!isVercel) {
      try {
        const backupFile = USERS_FILE + '.backup'
        if (fs.existsSync(USERS_FILE)) {
          fs.copyFileSync(USERS_FILE, backupFile)
        }
        
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(USERS_FILE, jsonString, 'utf8')
        
        try {
          const fd = fs.openSync(USERS_FILE, 'r+')
          fs.fsyncSync(fd)
          fs.closeSync(fd)
        } catch (syncError) {
          console.warn('ユーザーファイル同期警告（データは保存済み）:', syncError.message)
        }
        
        console.log(`ファイルにユーザーデータを保存: ${USERS_FILE} (${Object.keys(data.users).length}件)`)
        
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile)
        }
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    } else {
      console.log('Vercel環境: メモリストレージのみに保存')
    }
    
    console.log('ユーザー保存内容確認:', {
      usersCount: Object.keys(data.users).length,
      userIds: Object.keys(data.users),
      memoryStored: !!memoryStorage.users
    })
    
  } catch (error) {
    console.error('ユーザーデータの保存エラー:', error)
    throw error
  }
}

// ユーザーデータの非同期保存
async function saveUsersDataAsync(data) {
  try {
    // データの整合性チェック
    if (!data || !data.users) {
      console.error('保存しようとするユーザーデータが不正です:', data)
      throw new Error('Invalid user data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.users = JSON.parse(JSON.stringify(data))
    console.log(`メモリにユーザーデータを保存: ${Object.keys(data.users).length}件`)
    
    // 本番環境ではKVに保存
    if (useKV) {
      console.log('KVにユーザーデータ保存中...')
      try {
        const success = await kvStore.saveProductionData('users', data)
        if (success) {
          console.log(`KVにユーザーデータ保存成功: ${Object.keys(data.users).length}件`)
        } else {
          console.warn('KVへのユーザーデータ保存に失敗しましたが、メモリには保存済み')
        }
      } catch (error) {
        console.warn('KVユーザー保存中にエラーが発生しましたが、メモリには保存済み:', error.message)
      }
    } else if (isVercel) {
      console.warn('本番環境ですがKVが利用できません。メモリ内のみでユーザーデータを保持します。')
      console.log('Vercel環境: メモリストレージのみでユーザーデータ保存を継続')
    }
    
    // ファイルストレージに保存（ローカル環境のみ）
    if (!isVercel) {
      try {
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(USERS_FILE, jsonString, 'utf8')
        console.log(`ファイルにユーザーデータを保存: ${USERS_FILE} (${Object.keys(data.users).length}件)`)
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    }
    
  } catch (error) {
    console.error('ユーザーデータの非同期保存エラー:', error)
    throw error
  }
}

function saveGroupsData(data) {
  try {
    // データの整合性チェック
    if (!data || !data.groups) {
      console.error('保存しようとするグループデータが不正です:', data)
      throw new Error('Invalid group data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.groups = JSON.parse(JSON.stringify(data))
    console.log(`メモリにグループデータを保存: ${Object.keys(data.groups).length}件`)
    
    // 本番環境の場合は、非同期でKVに保存（バックグラウンド）
    if (useKV) {
      setImmediate(async () => {
        try {
          await kvStore.saveProductionData('groups', data)
          console.log('KVにグループデータ非同期保存完了')
        } catch (kvError) {
          console.warn('KVグループデータ非同期保存エラー:', kvError.message)
        }
      })
    }
    
    // ファイルストレージに保存（ローカル環境のみ、エラーは無視）
    if (!isVercel) {
      try {
        const backupFile = GROUPS_FILE + '.backup'
        if (fs.existsSync(GROUPS_FILE)) {
          fs.copyFileSync(GROUPS_FILE, backupFile)
        }
        
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(GROUPS_FILE, jsonString, 'utf8')
        
        try {
          const fd = fs.openSync(GROUPS_FILE, 'r+')
          fs.fsyncSync(fd)
          fs.closeSync(fd)
        } catch (syncError) {
          console.warn('グループファイル同期警告（データは保存済み）:', syncError.message)
        }
        
        console.log(`ファイルにグループデータを保存: ${GROUPS_FILE} (${Object.keys(data.groups).length}件)`)
        
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile)
        }
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    } else {
      console.log('Vercel環境: メモリストレージのみに保存')
    }
    
    console.log('グループ保存内容確認:', {
      groupsCount: Object.keys(data.groups).length,
      groupIds: Object.keys(data.groups),
      memoryStored: !!memoryStorage.groups
    })
    
  } catch (error) {
    console.error('グループデータの保存エラー:', error)
    throw error
  }
}

// グループデータの非同期保存
async function saveGroupsDataAsync(data) {
  try {
    // データの整合性チェック
    if (!data || !data.groups) {
      console.error('保存しようとするグループデータが不正です:', data)
      throw new Error('Invalid group data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.groups = JSON.parse(JSON.stringify(data))
    console.log(`メモリにグループデータを保存: ${Object.keys(data.groups).length}件`)
    
    // 本番環境ではKVに保存
    if (useKV) {
      console.log('KVにグループデータ保存中...')
      try {
        const success = await kvStore.saveProductionData('groups', data)
        if (success) {
          console.log(`KVにグループデータ保存成功: ${Object.keys(data.groups).length}件`)
        } else {
          console.warn('KVへのグループデータ保存に失敗しましたが、メモリには保存済み')
        }
      } catch (error) {
        console.warn('KVグループ保存中にエラーが発生しましたが、メモリには保存済み:', error.message)
      }
    } else if (isVercel) {
      console.warn('本番環境ですがKVが利用できません。メモリ内のみでグループデータを保持します。')
      console.log('Vercel環境: メモリストレージのみでグループデータ保存を継続')
    }
    
    // ファイルストレージに保存（ローカル環境のみ）
    if (!isVercel) {
      try {
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(GROUPS_FILE, jsonString, 'utf8')
        console.log(`ファイルにグループデータを保存: ${GROUPS_FILE} (${Object.keys(data.groups).length}件)`)
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    }
    
  } catch (error) {
    console.error('グループデータの非同期保存エラー:', error)
    throw error
  }
}

function saveLogsData(data) {
  try {
    // データの整合性チェック
    if (!data || !data.viewingLogs) {
      console.error('保存しようとするログデータが不正です:', data)
      throw new Error('Invalid log data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.logs = JSON.parse(JSON.stringify(data))
    console.log(`メモリにログデータを保存: ${Object.keys(data.viewingLogs).length}件`)
    
    // ファイルストレージに保存（ローカル環境のみ、エラーは無視）
    if (!isVercel) {
      try {
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(LOGS_FILE, jsonString, 'utf8')
        console.log(`ファイルにログデータを保存: ${LOGS_FILE} (${Object.keys(data.viewingLogs).length}件)`)
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    } else {
      console.log('Vercel環境: メモリストレージのみに保存')
    }
    
    console.log('ログ保存内容確認:', {
      logsCount: Object.keys(data.viewingLogs).length,
      memoryStored: !!memoryStorage.logs
    })
    
  } catch (error) {
    console.error('ログデータの保存エラー:', error)
    throw error
  }
}

function saveInstructorsData(data) {
  try {
    // データの整合性チェック
    if (!data || !data.instructors) {
      console.error('保存しようとする講師データが不正です:', data)
      throw new Error('Invalid instructor data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.instructors = JSON.parse(JSON.stringify(data))
    console.log(`メモリに講師データを保存: ${Object.keys(data.instructors).length}件`)
    
    // ファイルストレージに保存（ローカル環境のみ、エラーは無視）
    if (!isVercel) {
      try {
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(INSTRUCTORS_FILE, jsonString, 'utf8')
        console.log(`ファイルに講師データを保存: ${INSTRUCTORS_FILE} (${Object.keys(data.instructors).length}件)`)
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    } else {
      console.log('Vercel環境: メモリストレージのみに保存')
    }
    
    console.log('講師保存内容確認:', {
      instructorsCount: Object.keys(data.instructors).length,
      memoryStored: !!memoryStorage.instructors
    })
    
  } catch (error) {
    console.error('講師データの保存エラー:', error)
    throw error
  }
}

// =====================================================
// コース関連の操作
// =====================================================

// コースデータの取得（同期版）
function getCourses() {
  try {
    console.log('getCourses: データ取得開始')
    
    // 本番環境では常にKVから最新データを読み込み（メモリキャッシュを回避）
    if (isVercel) {
      console.log('getCourses: 本番環境 - KVからの非同期読み込みが必要')
      // 本番環境では非同期版を使用することを促す
      return []
    }
    
    // 開発環境のみメモリキャッシュ使用
    if (memoryStorage.courses && memoryStorage.courses.courses) {
      const coursesList = Object.values(memoryStorage.courses.courses)
      console.log('getCourses: メモリから取得:', coursesList.length, '件')
      return coursesList
    }
    
    // ファイルから同期読み込み（開発環境のみ）
    if (!isVercel && require('fs').existsSync(COURSES_FILE)) {
      const data = JSON.parse(require('fs').readFileSync(COURSES_FILE, 'utf8'))
      memoryStorage.courses = data
      return Object.values(data.courses || {})
    }
    
    console.log('getCourses: デフォルトデータ使用')
    return []
  } catch (error) {
    console.error('getCourses エラー:', error)
    return []
  }
}

// コースデータの非同期取得（KV対応）
async function getCoursesAsync() {
  try {
    console.log('getCoursesAsync: 非同期データ取得開始', {
      isVercel,
      useKV,
      environment: process.env.NODE_ENV
    })
    
    // 本番環境では常に最新データを取得（メモリキャッシュを無視）
    if (isVercel && useKV) {
      console.log('getCoursesAsync: KVから直接データ取得')
      try {
        const kvData = await kvStore.getProductionData('courses')
        if (kvData && kvData.courses) {
          const coursesList = Object.values(kvData.courses)
          console.log('getCoursesAsync: KVから取得成功:', coursesList.length, '件')
          // メモリキャッシュも更新
          memoryStorage.courses = kvData
          return coursesList
        }
      } catch (kvError) {
        console.error('KV取得エラー:', kvError)
      }
    }
    
    // 開発環境または KV失敗時のフォールバック
    const data = await loadCoursesData()
    const coursesList = Object.values(data.courses || {})
    console.log('getCoursesAsync: フォールバック取得:', coursesList.length, '件')
    return coursesList
  } catch (error) {
    console.error('getCoursesAsync エラー:', error)
    return []
  }
}

// コースの取得（ID指定・同期版）
function getCourseById(id) {
  const data = loadCoursesDataSync()
  return data.courses[id] || null
}

// コースの取得（ID指定・非同期版）
async function getCourseByIdAsync(id) {
  try {
    console.log('getCourseByIdAsync:', id)
    
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) {
      console.log('無効なコースID:', id)
      return null
    }
    
    const data = isVercel ? await loadCoursesData() : loadCoursesDataSync()
    const course = data.courses[parsedId] || null
    
    console.log('コース取得結果:', course ? `"${course.title}" (ID: ${course.id})` : 'なし')
    return course
  } catch (error) {
    console.error('getCourseByIdAsync エラー:', error)
    return null
  }
}

// コースの作成（同期版）
function createCourse(courseData) {
  try {
    console.log('createCourse呼び出し:', courseData)
    
    const data = loadCoursesDataSync()
    console.log('現在のコースデータ:', data)
    
    const newId = data.nextCourseId
    
    const newCourse = {
      id: newId,
      title: courseData.title,
      description: courseData.description || '',
      thumbnailUrl: courseData.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      curriculums: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('新規コース作成:', newCourse)
    
    data.courses[newId] = newCourse
    data.nextCourseId = newId + 1
    
    console.log('データ保存前:', data)
    saveCoursesDataSync(data)
    console.log('データ保存完了')
    
    return newCourse
  } catch (error) {
    console.error('createCourse内エラー:', error)
    throw error
  }
}

// コースの作成（非同期版・完全版）
async function createCourseAsync(courseData) {
  console.log('=== コース作成開始 ===')
  const operationId = `course_create_${Date.now()}`
  
  try {
    console.log(`${operationId}: 作成データ検証`, courseData)
    
    // 入力データ検証
    if (!courseData || !courseData.title || courseData.title.trim() === '') {
      throw new Error('コースタイトルは必須です')
    }
    
    // ステップ1: 最新データを取得
    console.log(`${operationId}: ステップ1 - 最新データ取得`)
    const data = isVercel ? await loadCoursesData() : loadCoursesDataSync()
    
    if (!data || !data.courses) {
      throw new Error('コースデータの取得に失敗しました')
    }
    
    console.log(`${operationId}: 現在のコース数: ${Object.keys(data.courses).length}件`)
    
    // ステップ2: 新しいコースを作成
    const newId = data.nextCourseId || 1
    const now = new Date().toISOString()
    
    const newCourse = {
      id: newId,
      title: courseData.title.trim(),
      description: (courseData.description || '').trim(),
      thumbnailUrl: courseData.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      curriculums: [],
      createdAt: now,
      updatedAt: now
    }
    
    console.log(`${operationId}: ステップ2 - 新規コース作成`, {
      id: newCourse.id,
      title: newCourse.title,
      thumbnailUrl: newCourse.thumbnailUrl ? 'あり' : 'なし'
    })
    
    // ステップ3: データに追加
    data.courses[newId] = newCourse
    data.nextCourseId = newId + 1
    
    console.log(`${operationId}: ステップ3 - データ更新完了 (次ID: ${data.nextCourseId})`)
    
    // ステップ4: 確実な保存
    console.log(`${operationId}: ステップ4 - データ保存開始`)
    
    if (isVercel) {
      const saveResult = await saveCoursesData(data)
      if (!saveResult.memorySaved) {
        throw new Error('メモリ保存に失敗しました')
      }
      
      console.log(`${operationId}: 保存結果:`, saveResult)
      
      // 保存確認
      const verifyData = isVercel ? await loadCoursesData() : loadCoursesDataSync()
      const savedCourse = verifyData.courses[newId]
      
      if (!savedCourse || savedCourse.title !== newCourse.title) {
        throw new Error('保存データの確認に失敗しました')
      }
      
      console.log(`${operationId}: ✓ 保存確認完了`)
    } else {
      saveCoursesDataSync(data)
      console.log(`${operationId}: ✓ ローカル保存完了`)
    }
    
    console.log(`=== ${operationId}: コース作成成功 ===`)
    
    return newCourse
    
  } catch (error) {
    console.error(`=== ${operationId}: コース作成失敗 ===`, {
      error: error.message,
      stack: error.stack,
      courseData
    })
    throw error
  }
}

// コースの更新
function updateCourse(id, courseData) {
  const data = loadCoursesData()
  const course = data.courses[id]
  
  if (!course) {
    return null
  }
  
  course.title = courseData.title
  course.description = courseData.description || ''
  if (courseData.thumbnailUrl !== undefined) {
    course.thumbnailUrl = courseData.thumbnailUrl
  }
  course.updatedAt = new Date().toISOString()
  
  saveCoursesData(data)
  return course
}

// コースの削除
function deleteCourse(id) {
  const data = loadCoursesData()
  const course = data.courses[id]
  
  if (!course) {
    return false
  }
  
  delete data.courses[id]
  saveCoursesData(data)
  return true
}

// =====================================================
// カリキュラム関連の操作
// =====================================================

// カリキュラムの作成（同期版）
function createCurriculum(courseId, curriculumData) {
  const data = loadCoursesDataSync()
  const course = data.courses[courseId]
  
  if (!course) {
    return null
  }
  
  const newId = data.nextCurriculumId
  const newCurriculum = {
    id: newId,
    title: curriculumData.title,
    description: curriculumData.description || '',
    courseId: courseId,
    videos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  if (!course.curriculums) {
    course.curriculums = []
  }
  course.curriculums.push(newCurriculum)
  data.nextCurriculumId = newId + 1
  course.updatedAt = new Date().toISOString()
  
  saveCoursesDataSync(data)
  return newCurriculum
}

// カリキュラムの作成（非同期版・完全版）
async function createCurriculumAsync(courseId, curriculumData) {
  console.log('=== カリキュラム作成開始 ===')
  const operationId = `curriculum_create_${Date.now()}`
  
  try {
    console.log(`${operationId}: 作成データ検証`, { courseId, curriculumData })
    
    // 入力データ検証
    if (!courseId || !curriculumData || !curriculumData.title || curriculumData.title.trim() === '') {
      throw new Error('コースIDとカリキュラム名は必須です')
    }
    
    const parsedCourseId = parseInt(courseId)
    if (isNaN(parsedCourseId)) {
      throw new Error('無効なコースIDです')
    }
    
    // ステップ1: 最新コースデータを取得
    console.log(`${operationId}: ステップ1 - 最新コースデータ取得`)
    const data = isVercel ? await loadCoursesData() : loadCoursesDataSync()
    
    if (!data || !data.courses) {
      throw new Error('コースデータの取得に失敗しました')
    }
    
    const course = data.courses[parsedCourseId]
    if (!course) {
      throw new Error(`コースID ${parsedCourseId} が見つかりません`)
    }
    
    console.log(`${operationId}: 対象コース: "${course.title}" (ID: ${parsedCourseId})`)
    
    // ステップ2: 新しいカリキュラムを作成
    const newId = data.nextCurriculumId || 1
    const now = new Date().toISOString()
    
    const newCurriculum = {
      id: newId,
      title: curriculumData.title.trim(),
      description: (curriculumData.description || '').trim(),
      courseId: parsedCourseId,
      videos: [],
      createdAt: now,
      updatedAt: now
    }
    
    console.log(`${operationId}: ステップ2 - 新規カリキュラム作成`, {
      id: newCurriculum.id,
      title: newCurriculum.title,
      courseId: newCurriculum.courseId
    })
    
    // ステップ3: コースにカリキュラムを追加
    if (!course.curriculums) {
      course.curriculums = []
    }
    course.curriculums.push(newCurriculum)
    data.nextCurriculumId = newId + 1
    course.updatedAt = now
    
    console.log(`${operationId}: ステップ3 - コース更新完了 (カリキュラム数: ${course.curriculums.length})`)
    
    // ステップ4: 確実な保存
    console.log(`${operationId}: ステップ4 - データ保存開始`)
    
    if (isVercel) {
      const saveResult = await saveCoursesData(data)
      if (!saveResult.memorySaved) {
        throw new Error('メモリ保存に失敗しました')
      }
      
      console.log(`${operationId}: 保存結果:`, saveResult)
      
      // 保存確認
      const verifyData = await loadCoursesData()
      const savedCourse = verifyData.courses[parsedCourseId]
      const savedCurriculum = savedCourse?.curriculums?.find(c => c.id === newId)
      
      if (!savedCurriculum || savedCurriculum.title !== newCurriculum.title) {
        throw new Error('カリキュラム保存データの確認に失敗しました')
      }
      
      console.log(`${operationId}: ✓ 保存確認完了`)
    } else {
      saveCoursesDataSync(data)
      console.log(`${operationId}: ✓ ローカル保存完了`)
    }
    
    console.log(`=== ${operationId}: カリキュラム作成成功 ===`)
    
    return newCurriculum
    
  } catch (error) {
    console.error(`=== ${operationId}: カリキュラム作成失敗 ===`, {
      error: error.message,
      stack: error.stack,
      courseId,
      curriculumData
    })
    throw error
  }
}

// カリキュラムの更新
function updateCurriculum(id, curriculumData) {
  const data = loadCoursesData()
  let targetCurriculum = null
  let targetCourse = null
  
  // すべてのコースからカリキュラムを検索
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      const curriculum = course.curriculums.find(c => c.id === id)
      if (curriculum) {
        targetCurriculum = curriculum
        targetCourse = course
        break
      }
    }
  }
  
  if (!targetCurriculum) {
    return null
  }
  
  targetCurriculum.title = curriculumData.title
  targetCurriculum.description = curriculumData.description || ''
  targetCurriculum.updatedAt = new Date().toISOString()
  targetCourse.updatedAt = new Date().toISOString()
  
  saveCoursesData(data)
  return targetCurriculum
}

// カリキュラムの削除
function deleteCurriculum(id) {
  const data = loadCoursesData()
  
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      const index = course.curriculums.findIndex(c => c.id === id)
      if (index !== -1) {
        course.curriculums.splice(index, 1)
        course.updatedAt = new Date().toISOString()
        saveCoursesData(data)
        return true
      }
    }
  }
  
  return false
}

// =====================================================
// 動画関連の操作
// =====================================================

// 動画の作成
function createVideo(videoData) {
  const data = loadCoursesData()
  let targetCurriculum = null
  let targetCourse = null
  
  // カリキュラムを検索
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      const curriculum = course.curriculums.find(c => c.id === videoData.curriculumId)
      if (curriculum) {
        targetCurriculum = curriculum
        targetCourse = course
        break
      }
    }
  }
  
  if (!targetCurriculum) {
    return null
  }
  
  const newId = data.nextVideoId
  const newVideo = {
    id: newId,
    title: videoData.title,
    description: videoData.description || '',
    videoUrl: videoData.videoUrl,
    curriculumId: videoData.curriculumId,
    duration: videoData.duration || 0,
    uploadedFile: videoData.uploadedFile || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  if (!targetCurriculum.videos) {
    targetCurriculum.videos = []
  }
  targetCurriculum.videos.push(newVideo)
  data.nextVideoId = newId + 1
  targetCourse.updatedAt = new Date().toISOString()
  
  saveCoursesData(data)
  return newVideo
}

// 動画の更新
function updateVideo(id, videoData) {
  const data = loadCoursesData()
  let targetVideo = null
  let targetCourse = null
  
  // すべてのコースから動画を検索
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      for (const curriculum of course.curriculums) {
        if (curriculum.videos) {
          const video = curriculum.videos.find(v => v.id === id)
          if (video) {
            targetVideo = video
            targetCourse = course
            break
          }
        }
      }
      if (targetVideo) break
    }
  }
  
  if (!targetVideo) {
    return null
  }
  
  targetVideo.title = videoData.title
  targetVideo.description = videoData.description || ''
  targetVideo.videoUrl = videoData.videoUrl
  targetVideo.updatedAt = new Date().toISOString()
  targetCourse.updatedAt = new Date().toISOString()
  
  saveCoursesData(data)
  return targetVideo
}

// 動画の削除
function deleteVideo(id) {
  const data = loadCoursesData()
  
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      for (const curriculum of course.curriculums) {
        if (curriculum.videos) {
          const index = curriculum.videos.findIndex(v => v.id === id)
          if (index !== -1) {
            curriculum.videos.splice(index, 1)
            course.updatedAt = new Date().toISOString()
            saveCoursesData(data)
            return true
          }
        }
      }
    }
  }
  
  return false
}

// 動画の取得（ID指定）
function getVideoById(id) {
  const data = loadCoursesData()
  
  for (const courseId in data.courses) {
    const course = data.courses[courseId]
    if (course.curriculums) {
      for (const curriculum of course.curriculums) {
        if (curriculum.videos) {
          const video = curriculum.videos.find(v => v.id === id)
          if (video) {
            return video
          }
        }
      }
    }
  }
  
  return null
}

// =====================================================
// ユーザー関連の操作
// =====================================================

// ユーザー一覧取得（同期版）
function getUsers() {
  try {
    console.log('getUsers: データ取得開始')
    
    // 本番環境では非同期版を推奨
    if (isVercel) {
      console.log('getUsers: 本番環境 - 非同期版を使用してください')
      // フォールバック用に簡易取得
      return Object.values(memoryStorage.users?.users || {})
    }
    
    // 開発環境のみ同期読み込み
    const data = loadUsersDataSync()
    console.log('getUsers: データ取得完了:', Object.keys(data.users || {}).length, '件')
    return Object.values(data.users || {})
  } catch (error) {
    console.error('getUsers エラー:', error)
    return []
  }
}

// ユーザー一覧取得（非同期版）
async function getUsersAsync() {
  try {
    console.log('getUsersAsync: 非同期データ取得開始', {
      isVercel,
      useKV,
      environment: process.env.NODE_ENV
    })
    
    // 本番環境では常に最新データを取得（メモリキャッシュを無視）
    if (isVercel && useKV) {
      console.log('getUsersAsync: KVから直接データ取得')
      try {
        const kvData = await kvStore.getProductionData('users')
        if (kvData && kvData.users) {
          const usersList = Object.values(kvData.users)
          console.log('getUsersAsync: KVから取得成功:', usersList.length, '件')
          // メモリキャッシュも更新
          memoryStorage.users = kvData
          return usersList
        }
      } catch (kvError) {
        console.error('KV取得エラー:', kvError)
      }
    }
    
    // 開発環境または KV失敗時のフォールバック
    const data = await loadUsersData()
    const usersList = Object.values(data.users || {})
    console.log('getUsersAsync: フォールバック取得:', usersList.length, '件')
    return usersList
  } catch (error) {
    console.error('getUsersAsync エラー:', error)
    return []
  }
}

// ユーザーの取得（ID指定）
function getUserById(id) {
  const data = loadUsersData()
  return data.users[id] || null
}

// ユーザーの取得（Email指定）
function getUserByEmail(email) {
  const data = loadUsersData()
  return Object.values(data.users || {}).find(user => user.email === email) || null
}

// メールアドレスとパスワードでユーザーを取得
function getUserByEmailAndPassword(email, password) {
  const data = loadUsersData()
  return Object.values(data.users || {}).find(user => 
    user.email === email && user.password === password
  ) || null
}

// ユーザーの作成（同期版）
function createUser(userData) {
  const data = loadUsersDataSync()
  const newId = data.nextUserId
  
  const newUser = {
    id: newId,
    email: userData.email,
    name: userData.name,
    role: userData.role || 'USER',
    groupId: userData.groupId || null,
    isFirstLogin: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  data.users[newId] = newUser
  data.nextUserId = newId + 1
  saveUsersData(data)
  
  return newUser
}

// ユーザーの作成（非同期版・完全版）
async function createUserAsync(userData) {
  console.log('=== ユーザー作成開始 ===')
  const operationId = `user_create_${Date.now()}`
  
  try {
    console.log(`${operationId}: 作成データ検証`, userData)
    
    // 入力データ検証
    if (!userData || !userData.email || !userData.name) {
      throw new Error('メールアドレスと名前は必須です')
    }
    
    if (userData.email.trim() === '' || userData.name.trim() === '') {
      throw new Error('メールアドレスと名前は空にできません')
    }
    
    // ステップ1: 最新データを取得
    console.log(`${operationId}: ステップ1 - 最新データ取得`)
    const data = isVercel ? await loadUsersData() : loadUsersDataSync()
    
    if (!data || !data.users) {
      throw new Error('ユーザーデータの取得に失敗しました')
    }
    
    // メールアドレス重複チェック
    const existingUser = Object.values(data.users).find(user => user.email === userData.email.trim())
    if (existingUser) {
      throw new Error('このメールアドレスは既に使用されています')
    }
    
    console.log(`${operationId}: 現在のユーザー数: ${Object.keys(data.users).length}件`)
    
    // ステップ2: 新しいユーザーを作成
    const newId = data.nextUserId || 1
    const now = new Date().toISOString()
    
    const newUser = {
      id: newId,
      email: userData.email.trim(),
      name: userData.name.trim(),
      role: (userData.role || 'USER').toUpperCase(),
      groupId: userData.groupId || null,
      isFirstLogin: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now
    }
    
    console.log(`${operationId}: ステップ2 - 新規ユーザー作成`, {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    })
    
    // ステップ3: データに追加
    data.users[newId] = newUser
    data.nextUserId = newId + 1
    
    console.log(`${operationId}: ステップ3 - データ更新完了 (次ID: ${data.nextUserId})`)
    
    // ステップ4: 確実な保存
    console.log(`${operationId}: ステップ4 - データ保存開始`)
    
    if (isVercel) {
      try {
        await saveUsersDataAsync(data)
        console.log(`${operationId}: ✓ ユーザーデータ保存成功`)
        
        // 保存確認
        const verifyData = await loadUsersData()
        const savedUser = verifyData.users[newId]
        
        if (!savedUser || savedUser.email !== newUser.email) {
          throw new Error('保存データの確認に失敗しました')
        }
        
        console.log(`${operationId}: ✓ 保存確認完了`)
      } catch (saveError) {
        console.error(`${operationId}: 保存エラー:`, saveError)
        throw saveError
      }
    } else {
      saveUsersData(data)
      console.log(`${operationId}: ✓ ローカル保存完了`)
    }
    
    console.log(`=== ${operationId}: ユーザー作成成功 ===`)
    
    return newUser
    
  } catch (error) {
    console.error(`=== ${operationId}: ユーザー作成失敗 ===`, {
      error: error.message,
      userData
    })
    throw error
  }
}

// ユーザーの更新
function updateUser(id, userData) {
  const data = loadUsersData()
  const user = data.users[id]
  
  if (!user) {
    return null
  }
  
  if (userData.email !== undefined) user.email = userData.email
  if (userData.name !== undefined) user.name = userData.name
  if (userData.role !== undefined) user.role = userData.role
  if (userData.groupId !== undefined) user.groupId = userData.groupId
  if (userData.isFirstLogin !== undefined) user.isFirstLogin = userData.isFirstLogin
  if (userData.lastLoginAt !== undefined) user.lastLoginAt = userData.lastLoginAt
  user.updatedAt = new Date().toISOString()
  
  saveUsersData(data)
  return user
}

// ユーザーの削除
function deleteUser(id) {
  const data = loadUsersData()
  const user = data.users[id]
  
  if (!user) {
    return false
  }
  
  delete data.users[id]
  saveUsersData(data)
  return true
}

// 初回ログイン待ちユーザー取得
function getFirstLoginPendingUsers() {
  const data = loadUsersData()
  return Object.values(data.users || {}).filter(user => user.isFirstLogin === true)
}

// =====================================================
// グループ関連の操作
// =====================================================

// グループ一覧取得（同期版）
function getGroups() {
  try {
    console.log('getGroups: データ取得開始')
    
    // 本番環境では非同期版を推奨
    if (isVercel) {
      console.log('getGroups: 本番環境 - 非同期版を使用してください')
      // フォールバック用に簡易取得
      return Object.values(memoryStorage.groups?.groups || {})
    }
    
    // 開発環境のみファイルから読み込み
    const data = loadGroupsData()
    console.log('getGroups: データ取得完了:', Object.keys(data.groups || {}).length, '件')
    return Object.values(data.groups || {})
  } catch (error) {
    console.error('getGroups エラー:', error)
    return []
  }
}

// グループ一覧取得（非同期版）
async function getGroupsAsync() {
  try {
    console.log('getGroupsAsync: 非同期データ取得開始', {
      isVercel,
      useKV,
      environment: process.env.NODE_ENV
    })
    
    // 本番環境では常に最新データを取得（メモリキャッシュを無視）
    if (isVercel && useKV) {
      console.log('getGroupsAsync: KVから直接データ取得')
      try {
        const kvData = await kvStore.getProductionData('groups')
        if (kvData && kvData.groups) {
          const groupsList = Object.values(kvData.groups)
          console.log('getGroupsAsync: KVから取得成功:', groupsList.length, '件')
          // メモリキャッシュも更新
          memoryStorage.groups = kvData
          return groupsList
        }
      } catch (kvError) {
        console.error('KV取得エラー:', kvError)
      }
    }
    
    // 開発環境または KV失敗時のフォールバック
    const data = await loadGroupsData()
    const groupsList = Object.values(data.groups || {})
    console.log('getGroupsAsync: フォールバック取得:', groupsList.length, '件')
    return groupsList
  } catch (error) {
    console.error('getGroupsAsync エラー:', error)
    return []
  }
}

// グループの取得（ID指定）
function getGroupById(id) {
  const data = loadGroupsData()
  return data.groups[id] || null
}

// グループの取得（Code指定）
function getGroupByCode(code) {
  const data = loadGroupsData()
  return Object.values(data.groups || {}).find(group => group.code === code) || null
}

// グループの作成（同期版）
function createGroup(groupData) {
  const data = loadGroupsDataSync()
  const newId = data.nextGroupId
  
  const newGroup = {
    id: newId,
    name: groupData.name,
    code: groupData.code,
    description: groupData.description || '',
    courseIds: groupData.courseIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  data.groups[newId] = newGroup
  data.nextGroupId = newId + 1
  saveGroupsData(data)
  
  return newGroup
}

// グループの作成（非同期版・完全版）
async function createGroupAsync(groupData) {
  console.log('=== グループ作成開始 ===')
  const operationId = `group_create_${Date.now()}`
  
  try {
    console.log(`${operationId}: 作成データ検証`, groupData)
    
    // 入力データ検証
    if (!groupData || !groupData.name || groupData.name.trim() === '') {
      throw new Error('グループ名は必須です')
    }
    
    if (!groupData.code || groupData.code.trim() === '') {
      throw new Error('グループコードは必須です')
    }
    
    // ステップ1: 最新データを取得
    console.log(`${operationId}: ステップ1 - 最新データ取得`)
    const data = isVercel ? await loadGroupsData() : loadGroupsDataSync()
    
    if (!data || !data.groups) {
      throw new Error('グループデータの取得に失敗しました')
    }
    
    console.log(`${operationId}: 現在のグループ数: ${Object.keys(data.groups).length}件`)
    
    // グループコードの重複チェック
    const existingGroup = Object.values(data.groups).find(group => 
      group.code === groupData.code.trim()
    )
    
    if (existingGroup) {
      throw new Error(`グループコード "${groupData.code.trim()}" は既に使用されています`)
    }
    
    // ステップ2: 新しいグループを作成
    const newId = data.nextGroupId || 1
    const now = new Date().toISOString()
    
    const newGroup = {
      id: newId,
      name: groupData.name.trim(),
      code: groupData.code.trim(),
      description: (groupData.description || '').trim(),
      courseIds: groupData.courseIds || [],
      createdAt: now,
      updatedAt: now
    }
    
    console.log(`${operationId}: ステップ2 - 新規グループ作成`, {
      id: newGroup.id,
      name: newGroup.name,
      code: newGroup.code,
      description: newGroup.description ? 'あり' : 'なし'
    })
    
    // ステップ3: データに追加
    data.groups[newId] = newGroup
    data.nextGroupId = newId + 1
    
    console.log(`${operationId}: ステップ3 - データ更新完了 (次ID: ${data.nextGroupId})`)
    
    // ステップ4: 確実な保存
    console.log(`${operationId}: ステップ4 - データ保存開始`)
    
    if (isVercel) {
      const saveResult = await saveGroupsDataAsync(data)
      console.log(`${operationId}: 保存結果: メモリ保存完了`)
      
      // 保存確認
      const verifyData = await loadGroupsData()
      const savedGroup = verifyData.groups[newId]
      
      if (!savedGroup || savedGroup.name !== newGroup.name || savedGroup.code !== newGroup.code) {
        throw new Error('保存データの確認に失敗しました')
      }
      
      console.log(`${operationId}: ✓ 保存確認完了`)
    } else {
      saveGroupsData(data)
      console.log(`${operationId}: ✓ ローカル保存完了`)
    }
    
    console.log(`=== ${operationId}: グループ作成成功 ===`)
    
    return newGroup
    
  } catch (error) {
    console.error(`=== ${operationId}: グループ作成失敗 ===`, {
      error: error.message,
      stack: error.stack,
      groupData
    })
    throw error
  }
}

// グループの更新
function updateGroup(id, groupData) {
  const data = loadGroupsData()
  const group = data.groups[id]
  
  if (!group) {
    return null
  }
  
  if (groupData.name !== undefined) group.name = groupData.name
  if (groupData.code !== undefined) group.code = groupData.code
  if (groupData.description !== undefined) group.description = groupData.description
  if (groupData.courseIds !== undefined) group.courseIds = groupData.courseIds
  group.updatedAt = new Date().toISOString()
  
  saveGroupsData(data)
  return group
}

// グループの削除
function deleteGroup(id) {
  const data = loadGroupsData()
  const group = data.groups[id]
  
  if (!group) {
    return false
  }
  
  delete data.groups[id]
  saveGroupsData(data)
  return true
}

// グループにコースを追加
function addCoursesToGroup(groupId, courseIds) {
  const data = loadGroupsData()
  const group = data.groups[groupId]
  
  if (!group) {
    return null
  }
  
  if (!group.courseIds) {
    group.courseIds = []
  }
  
  // 重複を避けて追加
  courseIds.forEach(courseId => {
    if (!group.courseIds.includes(courseId)) {
      group.courseIds.push(courseId)
    }
  })
  
  group.updatedAt = new Date().toISOString()
  saveGroupsData(data)
  return group
}

// グループからコースを削除
function removeCoursesFromGroup(groupId, courseIds) {
  const data = loadGroupsData()
  const group = data.groups[groupId]
  
  if (!group) {
    return null
  }
  
  if (!group.courseIds) {
    group.courseIds = []
  }
  
  courseIds.forEach(courseId => {
    const index = group.courseIds.indexOf(courseId)
    if (index > -1) {
      group.courseIds.splice(index, 1)
    }
  })
  
  group.updatedAt = new Date().toISOString()
  saveGroupsData(data)
  return group
}

// =====================================================
// 視聴ログ関連の操作
// =====================================================

// 視聴ログの作成・更新
function saveViewingLog(logData) {
  const data = loadLogsData()
  
  // 既存のログを検索（同じユーザーと動画の組み合わせ）
  const existingLog = Object.values(data.viewingLogs || {}).find(
    log => log.userId === logData.userId && log.videoId === logData.videoId
  )
  
  if (existingLog) {
    // 既存のログを更新
    existingLog.watchedSeconds = logData.watchedSeconds
    existingLog.isCompleted = logData.isCompleted || false
    existingLog.lastWatchedAt = new Date().toISOString()
    existingLog.updatedAt = new Date().toISOString()
    
    saveLogsData(data)
    return existingLog
  } else {
    // 新しいログを作成
    const newId = data.nextLogId
    const newLog = {
      id: newId,
      userId: logData.userId,
      videoId: logData.videoId,
      watchedSeconds: logData.watchedSeconds,
      totalDuration: logData.totalDuration || 0,
      isCompleted: logData.isCompleted || false,
      lastWatchedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    data.viewingLogs[newId] = newLog
    data.nextLogId = newId + 1
    saveLogsData(data)
    
    return newLog
  }
}

// ユーザーの視聴ログ取得
function getUserViewingLogs(userId) {
  const data = loadLogsData()
  return Object.values(data.viewingLogs || {}).filter(log => log.userId === userId)
}

// 動画の視聴ログ取得
function getVideoViewingLogs(videoId) {
  const data = loadLogsData()
  return Object.values(data.viewingLogs || {}).filter(log => log.videoId === videoId)
}

// 全視聴ログ取得
function getAllViewingLogs() {
  const data = loadLogsData()
  return Object.values(data.viewingLogs || {})
}

// 視聴統計取得
function getViewingStats() {
  const logs = getAllViewingLogs()
  const users = getUsers()
  const courses = getCourses()
  
  // 総動画数を計算
  let totalVideos = 0
  courses.forEach(course => {
    if (course.curriculums) {
      course.curriculums.forEach(curriculum => {
        if (curriculum.videos) {
          totalVideos += curriculum.videos.length
        }
      })
    }
  })
  
  const completedLogs = logs.filter(log => log.isCompleted)
  
  return {
    totalUsers: users.length,
    totalVideos: totalVideos,
    totalViewingLogs: logs.length,
    completedViewings: completedLogs.length,
    completionRate: totalVideos > 0 ? (completedLogs.length / totalVideos) * 100 : 0
  }
}

// =====================================================
// 講師関連の操作
// =====================================================

// 講師一覧を取得
function getInstructors() {
  const data = loadInstructorsData()
  return Object.values(data.instructors || {})
}

// 講師をIDで取得
function getInstructorById(id) {
  const data = loadInstructorsData()
  return data.instructors[id] || null
}

// 講師をメールアドレスで取得
function getInstructorByEmail(email) {
  const data = loadInstructorsData()
  return Object.values(data.instructors || {}).find(instructor => instructor.email === email) || null
}

// 講師の作成
function createInstructor(instructorData) {
  const data = loadInstructorsData()
  const newId = data.nextInstructorId
  
  const newInstructor = {
    id: newId,
    name: instructorData.name,
    email: instructorData.email,
    bio: instructorData.bio || '',
    expertise: instructorData.expertise || [],
    avatarUrl: instructorData.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  data.instructors[newId] = newInstructor
  data.nextInstructorId = newId + 1
  
  saveInstructorsData(data)
  return newInstructor
}

// 講師の更新
function updateInstructor(id, updates) {
  const data = loadInstructorsData()
  
  if (!data.instructors[id]) {
    return null
  }
  
  data.instructors[id] = {
    ...data.instructors[id],
    ...updates,
    id, // IDは変更不可
    updatedAt: new Date().toISOString()
  }
  
  saveInstructorsData(data)
  return data.instructors[id]
}

// 講師の削除
function deleteInstructor(id) {
  const data = loadInstructorsData()
  
  if (!data.instructors[id]) {
    return null
  }
  
  const deletedInstructor = data.instructors[id]
  delete data.instructors[id]
  
  saveInstructorsData(data)
  return deletedInstructor
}

module.exports = {
  // コース関連
  getCourses,
  getCoursesAsync,
  getCourseById,
  getCourseByIdAsync,
  createCourse,
  createCourseAsync,
  updateCourse,
  deleteCourse,
  
  // カリキュラム関連
  createCurriculum,
  createCurriculumAsync,
  updateCurriculum,
  deleteCurriculum,
  
  // 動画関連
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
  
  // ユーザー関連
  getUsers,
  getUsersAsync,
  getUserById,
  getUserByEmail,
  getUserByEmailAndPassword,
  createUser,
  createUserAsync,
  updateUser,
  deleteUser,
  getFirstLoginPendingUsers,
  
  // グループ関連
  getGroups,
  getGroupsAsync,
  getGroupById,
  getGroupByCode,
  createGroup,
  createGroupAsync,
  updateGroup,
  deleteGroup,
  addCoursesToGroup,
  removeCoursesFromGroup,
  
  // 視聴ログ関連
  saveViewingLog,
  getUserViewingLogs,
  getVideoViewingLogs,
  getAllViewingLogs,
  getViewingStats,
  
  // 講師関連
  getInstructors,
  getInstructorById,
  getInstructorByEmail,
  createInstructor,
  updateInstructor,
  deleteInstructor
}