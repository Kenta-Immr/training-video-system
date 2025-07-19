'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminNavButtonProps {
  href: string
  icon: string
  title: string
  description: string
  className?: string
}

export default function AdminNavButton({ href, icon, title, description, className = '' }: AdminNavButtonProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isNavigating) return
    
    setIsNavigating(true)
    
    try {
      // 少し遅延を入れてナビゲーションの確実性を高める
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push(href)
    } catch (error) {
      console.error('Navigation error:', error)
      // フォールバック: 通常のページ遷移
      window.location.href = href
    } finally {
      // ナビゲーションが失敗した場合のタイムアウト
      setTimeout(() => setIsNavigating(false), 2000)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center block w-full text-left ${isNavigating ? 'opacity-50 cursor-wait' : 'cursor-pointer'} ${className}`}
      disabled={isNavigating}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium">{isNavigating ? 'ページ移動中...' : title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  )
}