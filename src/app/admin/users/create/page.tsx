'use client'

import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import SimpleUserForm from '../simple-form'
import RealtimeUserList from '../realtime-list'

export default function CreateUserPage() {
  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">専用ユーザー作成ページ</h1>
          <p className="mt-2 text-gray-600">
            この専用ページでユーザーを確実に作成できます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SimpleUserForm />
          </div>
          
          <div>
            <RealtimeUserList />
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/admin/users" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← ユーザー管理ページに戻る
          </a>
        </div>
      </main>
    </AuthGuard>
  )
}