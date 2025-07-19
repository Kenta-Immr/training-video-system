'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { userAPI, UserData } from '@/lib/api'

interface UserProgress {
  totalVideos: number
  watchedVideos: number
  completedVideos: number
  totalWatchTime: number
  completionRate: number
}

interface UserWithProgress extends UserData {
  progress?: UserProgress
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.id ? parseInt(params.id as string) : null
  
  const [user, setUser] = useState<UserWithProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId])

  const fetchUser = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError('')
      console.log('Fetching user:', userId)
      
      const response = await userAPI.getById(userId)
      console.log('User API response:', response.data)
      
      // APIレスポンス構造を処理
      const userData = response.data?.data || response.data
      console.log('Processed user data:', userData)
      
      if (userData) {
        setUser(userData)
      } else {
        setError('ユーザー情報の取得に失敗しました')
      }
    } catch (error: any) {
      console.error('Fetch user error:', error)
      if (error.response?.status === 404) {
        setError('指定されたユーザーが見つかりません')
      } else {
        setError(error.response?.data?.error || error.message || 'ユーザー情報の取得に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '未設定'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}時間${mins}分`
  }

  if (loading) {
    return (
      <AdminPageWrapper title="ユーザー詳細" description="ユーザーの詳細情報と学習進捗">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (error || !user) {
    return (
      <AdminPageWrapper title="ユーザー詳細" description="ユーザーの詳細情報と学習進捗">
        <div className="text-center py-12">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error || 'ユーザーが見つかりません'}</p>
          </div>
          <button
            onClick={() => router.push('/admin/users/manage')}
            className="btn-primary"
          >
            ユーザー管理に戻る
          </button>
        </div>
      </AdminPageWrapper>
    )
  }

  return (
    <AdminPageWrapper title="ユーザー詳細" description="ユーザーの詳細情報と学習進捗">
      {/* ユーザー基本情報 */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">名前</label>
            <p className="text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">役割</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'ADMIN' ? '管理者' : '受講者'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">グループ</label>
            <p className="text-gray-900">
              {user.group ? user.group.name : '未所属'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">初回ログイン状態</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.isFirstLogin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {user.isFirstLogin ? '初回ログイン未完了' : 'ログイン済み'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">最終ログイン</label>
            <p className="text-gray-900">{formatDate(user.lastLoginAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">作成日</label>
            <p className="text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">更新日</label>
            <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* 学習進捗 */}
      {user.progress && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学習進捗</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{user.progress.totalVideos}</div>
              <div className="text-sm text-gray-600">総動画数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{user.progress.watchedVideos}</div>
              <div className="text-sm text-gray-600">視聴開始</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{user.progress.completedVideos}</div>
              <div className="text-sm text-gray-600">完了</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatTime(user.progress.totalWatchTime)}
              </div>
              <div className="text-sm text-gray-600">総視聴時間</div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>完了率</span>
              <span className="font-medium">{user.progress.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${user.progress.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">操作</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/admin/users/manage`)}
            className="btn-primary"
          >
            ユーザー情報を編集
          </button>
          <button
            onClick={() => {
              if (confirm('パスワードをリセットしますか？')) {
                alert('パスワードリセット機能は実装中です')
              }
            }}
            className="btn-secondary"
          >
            パスワードリセット
          </button>
          <button
            onClick={() => router.push('/admin/users/manage')}
            className="btn-outline"
          >
            ユーザー管理に戻る
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  )
}