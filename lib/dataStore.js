const fs = require('fs')
const path = require('path')

// KVストア（本番環境用）
let kvStore = null
try {
  kvStore = require('./kvStore')
} catch (error) {
  console.log('KVストア読み込みスキップ（開発環境）:', error.message)
}

// 環境に応じたデータストレージの設定（ホットリロード対応済み）
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production'
const useKV = kvStore && kvStore.isKVAvailable()

console.log('データストア設定:', {
  isVercel,
  useKV,
  kvAvailable: !!kvStore
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

// ハイブリッドデータ読み込み（本番：KV、開発：ファイル）
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

function loadUsersData() {
  try {
    console.log('ユーザーデータ読み込み開始:', {
      isVercel,
      hasMemoryData: !!memoryStorage.users,
      fileExists: !isVercel && fs.existsSync(USERS_FILE)
    })
    
    // ファイルから最初に読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルからユーザーデータ読み込み成功: ${Object.keys(parsed.users || {}).length}件`)
      // メモリストレージにも保存
      memoryStorage.users = parsed
      return parsed
    }
    
    // メモリストレージから確認（ファイルが無い場合）
    if (memoryStorage.users && memoryStorage.users.users && typeof memoryStorage.users.users === 'object') {
      console.log('メモリからユーザーデータ取得:', Object.keys(memoryStorage.users.users).length, '件')
      return memoryStorage.users
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトユーザーデータで初期化')
    let defaultData = DEFAULT_USERS_DATA
    
    memoryStorage.users = defaultData
    if (!isVercel) {
      saveUsersData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('ユーザーデータの読み込みエラー:', error)
    
    // 緊急復旧
    const emergencyData = {
      users: {},
      nextUserId: 1
    }
    
    memoryStorage.users = emergencyData
    console.log('緊急復旧: 空のユーザーデータで初期化')
    return emergencyData
  }
}

function loadGroupsData() {
  try {
    console.log('グループデータ読み込み開始:', {
      isVercel,
      hasMemoryData: !!memoryStorage.groups,
      fileExists: !isVercel && fs.existsSync(GROUPS_FILE)
    })
    
    // ファイルから最初に読み込み（ローカル環境のみ）
    if (!isVercel && fs.existsSync(GROUPS_FILE)) {
      const data = fs.readFileSync(GROUPS_FILE, 'utf8')
      const parsed = JSON.parse(data)
      
      console.log(`ファイルからグループデータ読み込み成功: ${Object.keys(parsed.groups || {}).length}件`)
      // メモリストレージにも保存
      memoryStorage.groups = parsed
      return parsed
    }
    
    // メモリストレージから確認（ファイルが無い場合）
    if (memoryStorage.groups && memoryStorage.groups.groups && typeof memoryStorage.groups.groups === 'object') {
      console.log('メモリからグループデータ取得:', Object.keys(memoryStorage.groups.groups).length, '件')
      return memoryStorage.groups
    }
    
    // デフォルトデータで初期化
    console.log('デフォルトグループデータで初期化')
    let defaultData = DEFAULT_GROUPS_DATA
    
    memoryStorage.groups = defaultData
    if (!isVercel) {
      saveGroupsData(defaultData)
    }
    return defaultData
    
  } catch (error) {
    console.error('グループデータの読み込みエラー:', error)
    
    // 緊急復旧
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

// 各データファイルの保存
async function saveCoursesData(data) {
  try {
    // データの整合性チェック
    if (!data || !data.courses) {
      console.error('保存しようとするデータが不正です:', data)
      throw new Error('Invalid data structure')
    }
    
    // メモリストレージに必ず保存（優先）
    memoryStorage.courses = JSON.parse(JSON.stringify(data))
    console.log(`メモリにコースデータを保存: ${Object.keys(data.courses).length}件`)
    
    // 本番環境ではKVに保存
    if (useKV) {
      console.log('KVにコースデータ保存中...')
      const success = await kvStore.saveProductionData('courses', data)
      if (success) {
        console.log(`KVにコースデータ保存成功: ${Object.keys(data.courses).length}件`)
      } else {
        console.warn('KVへの保存に失敗しましたが、メモリには保存済み')
      }
    }
    
    // ファイルストレージに保存（ローカル環境のみ、エラーは無視）
    if (!isVercel) {
      try {
        // バックアップファイルを作成
        const backupFile = COURSES_FILE + '.backup'
        if (fs.existsSync(COURSES_FILE)) {
          fs.copyFileSync(COURSES_FILE, backupFile)
        }
        
        const jsonString = JSON.stringify(data, null, 2)
        fs.writeFileSync(COURSES_FILE, jsonString, 'utf8')
        
        // ファイル書き込みの同期を強制（エラーハンドリング付き）
        try {
          const fd = fs.openSync(COURSES_FILE, 'r+')
          fs.fsyncSync(fd)
          fs.closeSync(fd)
        } catch (syncError) {
          console.warn('ファイル同期警告（データは保存済み）:', syncError.message)
        }
        
        console.log(`ファイルにコースデータを保存: ${COURSES_FILE} (${Object.keys(data.courses).length}件)`)
        
        // バックアップファイルを削除（保存成功時）
        if (fs.existsSync(backupFile)) {
          fs.unlinkSync(backupFile)
        }
      } catch (fileError) {
        console.warn('ファイル保存は失敗しましたが、メモリには保存済み:', fileError.message)
      }
    } else {
      console.log('Vercel環境: メモリストレージのみに保存')
    }
    
    console.log('保存内容確認:', {
      coursesCount: Object.keys(data.courses).length,
      courseIds: Object.keys(data.courses),
      memoryStored: !!memoryStorage.courses
    })
    
  } catch (error) {
    console.error('コースデータの保存エラー:', error)
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

// コースデータの取得
async function getCourses() {
  try {
    console.log('getCourses: データ取得開始')
    
    // 常に最新データを読み込む（本番：KV、開発：ファイル）
    const data = await loadCoursesData()
    console.log('getCourses: 読み込まれたデータ構造:', {
      courses: Object.keys(data.courses || {}),
      coursesCount: Object.keys(data.courses || {}).length,
      nextCourseId: data.nextCourseId
    })
    const coursesList = Object.values(data.courses || {})
    console.log('getCourses: 変換後のコース配列:', coursesList.map(c => ({ id: c.id, title: c.title })))
    return coursesList
  } catch (error) {
    console.error('getCourses エラー:', error)
    return []
  }
}

// コースの取得（ID指定）
function getCourseById(id) {
  const data = loadCoursesData()
  return data.courses[id] || null
}

// コースの作成
function createCourse(courseData) {
  try {
    console.log('createCourse呼び出し:', courseData)
    
    const data = loadCoursesData()
    console.log('現在のコースデータ:', data)
    
    const newId = data.nextCourseId
    
    const newCourse = {
      id: newId,
      title: courseData.title,
      description: courseData.description || '',
      thumbnailUrl: courseData.thumbnailUrl || '',
      curriculums: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('新規コース作成:', newCourse)
    
    data.courses[newId] = newCourse
    data.nextCourseId = newId + 1
    
    console.log('データ保存前:', data)
    saveCoursesData(data)
    console.log('データ保存完了')
    
    return newCourse
  } catch (error) {
    console.error('createCourse内エラー:', error)
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

// カリキュラムの作成
function createCurriculum(courseId, curriculumData) {
  const data = loadCoursesData()
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
  
  saveCoursesData(data)
  return newCurriculum
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

// ユーザー一覧取得
function getUsers() {
  try {
    console.log('getUsers: データ取得開始')
    
    // 常にファイルから最新データを読み込む
    const data = loadUsersData()
    console.log('getUsers: データ取得完了:', Object.keys(data.users || {}).length, '件')
    return Object.values(data.users || {})
  } catch (error) {
    console.error('getUsers エラー:', error)
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

// ユーザーの作成
function createUser(userData) {
  const data = loadUsersData()
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

// グループ一覧取得
function getGroups() {
  try {
    console.log('getGroups: データ取得開始')
    
    // 常にファイルから最新データを読み込む
    const data = loadGroupsData()
    console.log('getGroups: データ取得完了:', Object.keys(data.groups || {}).length, '件')
    return Object.values(data.groups || {})
  } catch (error) {
    console.error('getGroups エラー:', error)
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

// グループの作成
function createGroup(groupData) {
  const data = loadGroupsData()
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
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  
  // カリキュラム関連
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  
  // 動画関連
  createVideo,
  updateVideo,
  deleteVideo,
  getVideoById,
  
  // ユーザー関連
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByEmailAndPassword,
  createUser,
  updateUser,
  deleteUser,
  getFirstLoginPendingUsers,
  
  // グループ関連
  getGroups,
  getGroupById,
  getGroupByCode,
  createGroup,
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