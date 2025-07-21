const fs = require('fs')
const path = require('path')

// データファイルのパス
const DATA_DIR = path.join(process.cwd(), 'data')
const COURSES_FILE = path.join(DATA_DIR, 'courses.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json')
const LOGS_FILE = path.join(DATA_DIR, 'logs.json')

// データディレクトリが存在しない場合は作成
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
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

// 各データファイルの読み込み
function loadCoursesData() {
  try {
    if (fs.existsSync(COURSES_FILE)) {
      const data = fs.readFileSync(COURSES_FILE, 'utf8')
      return JSON.parse(data)
    } else {
      saveCoursesData(DEFAULT_COURSES_DATA)
      return DEFAULT_COURSES_DATA
    }
  } catch (error) {
    console.error('コースデータの読み込みエラー:', error)
    return DEFAULT_COURSES_DATA
  }
}

function loadUsersData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8')
      return JSON.parse(data)
    } else {
      saveUsersData(DEFAULT_USERS_DATA)
      return DEFAULT_USERS_DATA
    }
  } catch (error) {
    console.error('ユーザーデータの読み込みエラー:', error)
    return DEFAULT_USERS_DATA
  }
}

function loadGroupsData() {
  try {
    if (fs.existsSync(GROUPS_FILE)) {
      const data = fs.readFileSync(GROUPS_FILE, 'utf8')
      return JSON.parse(data)
    } else {
      saveGroupsData(DEFAULT_GROUPS_DATA)
      return DEFAULT_GROUPS_DATA
    }
  } catch (error) {
    console.error('グループデータの読み込みエラー:', error)
    return DEFAULT_GROUPS_DATA
  }
}

function loadLogsData() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8')
      return JSON.parse(data)
    } else {
      saveLogsData(DEFAULT_LOGS_DATA)
      return DEFAULT_LOGS_DATA
    }
  } catch (error) {
    console.error('ログデータの読み込みエラー:', error)
    return DEFAULT_LOGS_DATA
  }
}

// 各データファイルの保存
function saveCoursesData(data) {
  try {
    fs.writeFileSync(COURSES_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log('コースデータを保存しました:', COURSES_FILE)
  } catch (error) {
    console.error('コースデータの保存エラー:', error)
  }
}

function saveUsersData(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log('ユーザーデータを保存しました:', USERS_FILE)
  } catch (error) {
    console.error('ユーザーデータの保存エラー:', error)
  }
}

function saveGroupsData(data) {
  try {
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log('グループデータを保存しました:', GROUPS_FILE)
  } catch (error) {
    console.error('グループデータの保存エラー:', error)
  }
}

function saveLogsData(data) {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2), 'utf8')
    console.log('ログデータを保存しました:', LOGS_FILE)
  } catch (error) {
    console.error('ログデータの保存エラー:', error)
  }
}

// =====================================================
// コース関連の操作
// =====================================================

// コースデータの取得
function getCourses() {
  const data = loadCoursesData()
  return Object.values(data.courses || {})
}

// コースの取得（ID指定）
function getCourseById(id) {
  const data = loadCoursesData()
  return data.courses[id] || null
}

// コースの作成
function createCourse(courseData) {
  const data = loadCoursesData()
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
  
  data.courses[newId] = newCourse
  data.nextCourseId = newId + 1
  saveCoursesData(data)
  
  return newCourse
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
  const data = loadUsersData()
  return Object.values(data.users || {})
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
  const data = loadGroupsData()
  return Object.values(data.groups || {})
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
  getViewingStats
}