'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, User } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 本番環境での認証チェック
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      console.log('AuthGuard - No user found, redirecting to login')
      router.push('/login')
      return
    }

    if (requireAdmin && currentUser.role !== 'ADMIN') {
      console.log('AuthGuard - Admin required but user role is:', currentUser.role)
      console.log('AuthGuard - Redirecting to home')
      router.push('/')
      return
    }

    setUser(currentUser)
    setLoading(false)
  }, [router, requireAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}