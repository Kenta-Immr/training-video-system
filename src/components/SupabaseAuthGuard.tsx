'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getCurrentProfile, onAuthStateChange } from '../../lib/supabaseAuth'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireInstructor?: boolean
  redirectTo?: string
}

interface UserProfile {
  id: string
  user_id: string
  name: string
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR'
  group_id?: number
  is_first_login: boolean
}

export default function SupabaseAuthGuard({ 
  children, 
  requireAdmin = false, 
  requireInstructor = false,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // 初期認証状態チェック
    const checkAuth = async () => {
      try {
        const { user: currentUser } = await getCurrentUser()
        
        if (!mounted) return

        if (currentUser) {
          const { profile: userProfile } = await getCurrentProfile()
          
          if (!mounted) return

          setUser(currentUser)
          setProfile(userProfile)

          // 権限チェック
          if (requireAdmin && userProfile?.role !== 'ADMIN') {
            router.push('/unauthorized')
            return
          }

          if (requireInstructor && !['ADMIN', 'INSTRUCTOR'].includes(userProfile?.role)) {
            router.push('/unauthorized')
            return
          }

        } else {
          router.push(redirectTo)
          return
        }
      } catch (error) {
        console.error('認証チェックエラー:', error)
        if (mounted) {
          router.push(redirectTo)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // 認証状態の変更監視
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const { profile: userProfile } = await getCurrentProfile()
        setUser(session.user)
        setProfile(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        router.push(redirectTo)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [requireAdmin, requireInstructor, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null // リダイレクト中
  }

  // 子コンポーネントにユーザー情報を提供
  return (
    <div>
      {children}
    </div>
  )
}

// 認証が必要なページで使用するHook
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadAuth = async () => {
      try {
        const { user: currentUser } = await getCurrentUser()
        
        if (!mounted) return

        if (currentUser) {
          const { profile: userProfile } = await getCurrentProfile()
          setUser(currentUser)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('認証情報取得エラー:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadAuth()

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const { profile: userProfile } = await getCurrentProfile()
        setUser(session.user)
        setProfile(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}