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
    const currentUser = getCurrentUser()
    
    // ユーザーがログインしていない場合
    if (!currentUser) {
      router.push('/login')
      return
    }

    // 管理者権限が必要なページで、ユーザーが管理者でない場合
    if (requireAdmin && currentUser.role !== 'ADMIN') {
      // 管理者でない場合は、アクセス拒否画面を表示せずにメインページへリダイレクト
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