import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

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
  console.log('getCurrentUser - token:', token ? `${token.substring(0, 20)}...` : 'null')
  
  if (!token) {
    console.log('getCurrentUser - no token found')
    return null
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token)
    console.log('getCurrentUser - decoded token:', decoded)
    
    const isExpired = decoded.exp * 1000 < Date.now()
    console.log('getCurrentUser - is expired:', isExpired, 'exp:', new Date(decoded.exp * 1000))
    
    if (isExpired) {
      console.log('getCurrentUser - token expired, removing')
      removeToken()
      return null
    }

    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: '',
      role: decoded.role
    }
    console.log('getCurrentUser - returning user:', user)
    return user
  } catch (error) {
    console.error('getCurrentUser - error decoding token:', error)
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