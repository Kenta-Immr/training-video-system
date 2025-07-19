'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'

interface AdminPageWrapperProps {
  children: React.ReactNode
  title: string
  description?: string
}

export default function AdminPageWrapper({ children, title, description }: AdminPageWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ハイドレーション完了前は何も表示しない
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {description && (
                <p className="mt-2 text-gray-600">{description}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← 管理画面に戻る
            </button>
          </div>
        </div>
        
        {children}
      </main>
    </AuthGuard>
  )
}