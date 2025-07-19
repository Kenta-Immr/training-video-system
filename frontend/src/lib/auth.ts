import Cookies from 'js-cookie'
import jwt_decode from 'jwt-decode'

export interface User {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

export interface DecodedToken {
  userId: number
  email: string
  role: 'USER' | 'ADMIN'
  exp: number
}

export const getToken = (): string | null => {
  // LocalStorageを優先し、なければCookieを確認
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || Cookies.get('token') || null
  }
  return Cookies.get('token') || null
}

export const setToken = (token: string): void => {
  // LocalStorageとCookieの両方に保存
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
  Cookies.set('token', token, { expires: 1 })
}

export const removeToken = (): void => {
  // LocalStorageとCookieの両方から削除
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
  Cookies.remove('token')
}

export const getCurrentUser = (): User | null => {
  const token = getToken()
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt_decode<DecodedToken>(token)
    
    const isExpired = decoded.exp * 1000 < Date.now()
    
    if (isExpired) {
      removeToken()
      return null
    }

    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: '',
      role: decoded.role
    }
    return user
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCurrentUser - error decoding token:', error)
    }
    removeToken()
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

export const isAdmin = (): boolean => {
  const user = getCurrentUser()
  return user?.role === 'ADMIN'
}