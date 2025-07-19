'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getCurrentUser, removeToken, User } from '@/lib/auth'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleLogout = () => {
    removeToken()
    window.location.href = '/login'
  }

  if (!user) return null

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              研修動画システム
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
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
        </div>
      </div>
    </header>
  )
}