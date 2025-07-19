'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser, removeToken, User } from '@/lib/auth'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleLogout = () => {
    removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900">
              研修動画システム
            </Link>
          </div>

          {/* デスクトップメニュー */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              コース一覧
            </Link>
            
            <Link
              href="/group-progress"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              グループ進捗
            </Link>
            
            {user.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                管理画面
              </Link>
            )}

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.name || user.email}
                {user.role === 'ADMIN' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    管理者
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </nav>

          {/* モバイルメニューボタン - 常に表示 */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white border border-gray-300"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">メニューを開く</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 z-50 bg-white shadow-lg border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                📚 コース一覧
              </Link>
              
              <Link
                href="/group-progress"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                📊 グループ進捗
              </Link>
              
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md border-b border-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ 管理画面
                </Link>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="px-4 py-2">
                  <div className="text-sm font-medium text-gray-900">
                    👤 {user.name || user.email}
                  </div>
                  {user.role === 'ADMIN' && (
                    <div className="mt-1">
                      <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        管理者
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                >
                  🚪 ログアウト
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}