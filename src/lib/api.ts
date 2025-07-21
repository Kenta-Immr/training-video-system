import axios from 'axios'
import { getToken, removeToken } from './auth'

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (typeof window !== 'undefined' ? window.location.origin : '') // 本番環境では同一ドメインのVercel Functions
  : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'))

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  timeout: 30000, // 30秒のタイムアウト
})

api.interceptors.request.use((config) => {
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    baseURL: config.baseURL,
    data: config.data
  })
  
  // キャッシュ回避のためタイムスタンプパラメータを追加
  if (config.method === 'get') {
    const separator = config.url?.includes('?') ? '&' : '?'
    config.url = `${config.url}${separator}_t=${Date.now()}`
  }
  
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    })
    return response
  },
  (error) => {
    console.error('API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  groupCode?: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
    role: string
  }
}

export interface Course {
  id: number
  title: string
  description?: string
  thumbnailUrl?: string
  curriculums: Curriculum[]
}

export interface Curriculum {
  id: number
  title: string
  description?: string
  courseId: number
  videos: Video[]
}

export interface Video {
  id: number
  title: string
  description?: string
  videoUrl: string
  curriculumId: number
  viewingLogs?: ViewingLog[]
}

export interface ViewingLog {
  id: number
  userId: number
  videoId: number
  watchedSeconds: number
  isCompleted: boolean
  lastWatchedAt: string
}

export interface ViewingLogRequest {
  videoId: number
  watchedSeconds: number
  isCompleted?: boolean
}

export const authAPI = {
  login: (data: LoginRequest) => {
    console.log('AuthAPI Login called with:', data)
    return api.post<LoginResponse>('/api/auth', data)
  },
  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/api/auth', data),
  debugLogin: (data: LoginRequest) => {
    console.log('Debug AuthAPI Login called with:', data)
    return api.post<LoginResponse>('/api/debug-auth', data)
  }
}

// デモコースデータ（本番用フォールバック）
const DEMO_COURSES: Course[] = [
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
          { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
          { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 }
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
          { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
          { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "ビジネススキル向上",
    description: "プレゼンテーション、コミュニケーション、プロジェクト管理のスキルアップ",
    thumbnailUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    curriculums: [
      {
        id: 3,
        title: "プレゼンテーション",
        description: "効果的な資料作成と発表技術",
        courseId: 3,
        videos: [
          { id: 5, title: "資料作成のコツ", description: "見やすい資料の作り方", videoUrl: "#", curriculumId: 3 }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "AI・機械学習基礎",
    description: "Pythonを使った機械学習の基礎と実践的なデータ分析",
    thumbnailUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    curriculums: [
      {
        id: 4,
        title: "Python基礎",
        description: "Pythonプログラミングの基本",
        courseId: 4,
        videos: [
          { id: 6, title: "Python入門", description: "Pythonの基本構文", videoUrl: "#", curriculumId: 4 }
        ]
      }
    ]
  }
];

export const courseAPI = {
  getAll: () => api.get<Course[]>(`/api/courses?t=${Date.now()}`),
  getById: (id: number) => api.get<Course>(`/api/courses/${id}?t=${Date.now()}`),
  create: (data: { title: string; description?: string; thumbnailUrl?: string }) =>
    api.post<Course>('/api/courses', data),
  update: (id: number, data: { title: string; description?: string; thumbnailUrl?: string }) =>
    api.put<Course>(`/api/courses/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/courses/${id}`),
  uploadThumbnail: (formData: FormData) => {
    // ファイル名をヘッダーに追加してデモ用の一意性を確保
    const file = formData.get('thumbnail') as File
    const filename = file ? file.name : 'thumbnail'
    
    // ファイル名をBase64エンコードしてHTTPヘッダーで安全に送信
    const encodedFilename = btoa(encodeURIComponent(filename))
    
    return api.post<{ thumbnailUrl: string }>('/api/courses/upload-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Filename': encodedFilename,
      },
      timeout: 60000, // サムネイルアップロードは60秒タイムアウト
    })
  },
  createCurriculum: (courseId: number, data: { title: string; description?: string }) =>
    api.post<Curriculum>(`/api/courses/${courseId}/curriculums`, data),
  updateCurriculum: (id: number, data: { title: string; description?: string }) =>
    api.put<Curriculum>(`/api/courses/curriculums/${id}`, data),
  deleteCurriculum: (id: number) =>
    api.delete(`/api/courses/curriculums/${id}`),
}

export const videoAPI = {
  getById: (id: number) => api.get<Video>(`/api/videos/${id}`),
  getAll: () => api.get<Video[]>(`/api/get-videos?t=${Date.now()}`),
  // 古い create を削除 - 確実エンドポイントのみ使用
  upload: (formData: FormData) =>
    api.post<Video>('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 動画アップロードは120秒タイムアウト
    }),
  update: (id: number, data: { title: string; description?: string; videoUrl: string }) =>
    api.put<Video>(`/api/videos/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/videos/${id}`),
}

export const logAPI = {
  saveLog: (data: ViewingLogRequest) =>
    api.post<ViewingLog>('/api/logs', data),
  getMyLogs: () =>
    api.get<ViewingLog[]>('/api/logs/my-logs'),
  getUserLogs: (userId: number) =>
    api.get<ViewingLog[]>(`/api/logs/users/${userId}`),
  getVideoLogs: (videoId: number) =>
    api.get<ViewingLog[]>(`/api/logs/videos/${videoId}`),
  getStats: () =>
    api.get('/api/logs/stats'),
}

export interface UserData {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  groupId?: number
  group?: Group
  isFirstLogin?: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Group {
  id: number
  name: string
  code: string
  description?: string
  users?: UserData[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role?: 'USER' | 'ADMIN'
}

export interface UpdateUserRequest {
  email: string
  name: string
  role?: 'USER' | 'ADMIN'
  password?: string
}

export interface BulkCreateUserRequest {
  users?: {
    email: string
    name: string
    password: string
    role?: 'USER' | 'ADMIN'
    groupId?: number
    groupName?: string
  }[]
  csvText?: string
}

export interface BulkCreateUserResponse {
  success: number
  errors: number
  created: UserData[]
  failed: {
    index: number
    email: string
    error: string
  }[]
}

export const userAPI = {
  getMe: () =>
    api.get<UserData>('/api/users/me'),
  getAll: () =>
    api.get<UserData[]>(`/api/get-users?t=${Date.now()}`),
  getById: (id: number) =>
    api.get<UserData>(`/api/users/${id}`),
  // 古い create を完全削除 - 緊急エンドポイントのみ使用
  update: (id: number, data: UpdateUserRequest) =>
    api.put<UserData>(`/api/users/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/users/${id}`),
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/api/users/${id}/reset-password`, { newPassword }),
  bulkCreate: (data: BulkCreateUserRequest) =>
    api.post<BulkCreateUserResponse>('/api/users/bulk-create', data),
  getFirstLoginPending: () =>
    api.get<UserData[]>('/api/users/first-login-pending'),
}

export interface GroupProgress {
  group: {
    id: number
    name: string
    code: string
    description?: string
  }
  courses: Course[]
  members: {
    user: {
      id: number
      name: string
      email: string
      role: string
      isFirstLogin: boolean
      lastLoginAt?: string
      createdAt: string
    }
    progress: {
      totalVideos: number
      watchedVideos: number
      completedVideos: number
      completionRate: number
      watchRate: number
    }
  }[]
}

export const groupAPI = {
  getAll: () =>
    api.get<Group[]>(`/api/groups?t=${Date.now()}`),
  getById: (id: number) =>
    api.get<Group>(`/api/groups/${id}`),
  create: (data: { name: string; code: string; description?: string }) =>
    api.post<Group>('/api/groups', data),
  update: (id: number, data: { name: string; code: string; description?: string }) =>
    api.put<Group>(`/api/groups/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/groups/${id}`),
  addUsers: (id: number, userIds: number[]) =>
    api.post(`/api/groups/${id}/users`, { userIds }),
  removeUsers: (id: number, userIds: number[]) =>
    api.delete(`/api/groups/${id}/users`, { data: { userIds } }),
  getCourses: (id: number) =>
    api.get<Course[]>(`/api/groups/${id}/courses`),
  addCourses: (id: number, courseIds: number[]) =>
    api.post(`/api/groups/${id}/courses`, { courseIds }),
  removeCourses: (id: number, courseIds: number[]) =>
    api.delete(`/api/groups/${id}/courses`, { data: { courseIds } }),
  getProgress: (id: number) =>
    api.get<GroupProgress>(`/api/groups/${id}/progress`),
  getUserProgress: (id: number, userId: number) =>
    api.get<UserData>(`/api/groups/${id}/progress/${userId}`),
}

export default api