'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersRedirect() {
  const router = useRouter()

  useEffect(() => {
    // ユーザー管理のメインページにリダイレクト
    router.replace('/admin/users/manage')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">ユーザー管理画面に移動中...</p>
      </div>
    </div>
  )
}