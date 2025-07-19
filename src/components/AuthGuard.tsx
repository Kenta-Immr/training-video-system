'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, User } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  // 一時的に認証をスキップしてシステムを使用可能にする
  const [user, setUser] = useState<User | null>({
    id: 1,
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN'
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 認証チェックを無効化
  /*
  useEffect(() => {
    const currentUser = getCurrentUser()
    
    if (!currentUser) {
      router.push('/login')
      return
    }

    if (requireAdmin && currentUser.role !== 'ADMIN') {
      router.push('/')
      return
    }

    setUser(currentUser)
    setLoading(false)
  }, [router, requireAdmin])
  */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}