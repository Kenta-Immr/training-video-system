import axios from 'axios'
import { getToken, removeToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/login'
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
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/api/auth/login', data),
  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/api/auth/register', data),
}

export const courseAPI = {
  getAll: () => 
    api.get<Course[]>('/api/courses'),
  getById: (id: number) => 
    api.get<Course>(`/api/courses/${id}`),
  create: (data: { title: string; description?: string; thumbnailUrl?: string }) =>
    api.post<Course>('/api/courses', data),
  update: (id: number, data: { title: string; description?: string; thumbnailUrl?: string }) =>
    api.put<Course>(`/api/courses/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/courses/${id}`),
  uploadThumbnail: (formData: FormData) =>
    api.post<{ thumbnailUrl: string }>('/api/courses/upload-thumbnail', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  createCurriculum: (courseId: number, data: { title: string; description?: string }) =>
    api.post<Curriculum>(`/api/courses/${courseId}/curriculums`, data),
  updateCurriculum: (id: number, data: { title: string; description?: string }) =>
    api.put<Curriculum>(`/api/courses/curriculums/${id}`, data),
  deleteCurriculum: (id: number) =>
    api.delete(`/api/courses/curriculums/${id}`),
}

export const videoAPI = {
  getById: (id: number) =>
    api.get<Video>(`/api/videos/${id}`),
  create: (data: { title: string; description?: string; videoUrl: string; curriculumId: number }) =>
    api.post<Video>('/api/videos', data),
  upload: (formData: FormData) =>
    api.post<Video>('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
  users: {
    email: string
    name: string
    password: string
    role?: 'USER' | 'ADMIN'
    groupId?: number
    groupName?: string
  }[]
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
  getAll: () =>
    api.get<UserData[]>('/api/users'),
  getById: (id: number) =>
    api.get<UserData>(`/api/users/${id}`),
  create: (data: CreateUserRequest) =>
    api.post<UserData>('/api/users', data),
  update: (id: number, data: UpdateUserRequest) =>
    api.put<UserData>(`/api/users/${id}`, data),
  delete: (id: number) =>
    api.delete(`/api/users/${id}`),
  resetPassword: (id: number, newPassword: string) =>
    api.post(`/api/users/${id}/reset-password`, { newPassword }),
  bulkCreate: (data: BulkCreateUserRequest) =>
    api.post<BulkCreateUserResponse>('/api/users/bulk-create', data),
  getFirstLoginPending: () =>
    api.get<UserData[]>('/api/users/reports/first-login-pending'),
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
    api.get<Group[]>('/api/groups'),
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