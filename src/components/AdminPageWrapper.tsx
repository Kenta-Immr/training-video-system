'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'

// エラーバウンダリーコンポーネント
class AdminErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Admin page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                ページエラーが発生しました
              </h2>
              <p className="mt-2 text-gray-600">
                ページの読み込み中にエラーが発生しました。
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full btn-primary"
              >
                ページを再読み込み
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="w-full btn-secondary"
              >
                管理画面に戻る
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-red-50 rounded text-left">
                <pre className="text-xs text-red-800 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface AdminPageWrapperProps {
  children: React.ReactNode
  title: string
  description?: string
}

export default function AdminPageWrapper({ children, title, description }: AdminPageWrapperProps) {
  console.log('📦📦📦 AdminPageWrapper rendering with title:', title)
  console.log('📦 Description:', description)
  console.log('📦 Current path:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
  
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
    <AdminErrorBoundary>
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
    </AdminErrorBoundary>
  )
}