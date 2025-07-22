'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { userAPI, UserData } from '@/lib/api'
import EmergencyUserForm from './emergency-form'
import UnifiedUserForm from './unified-form'

interface UserForm {
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  groupId?: number
  password?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showEmergencyForm, setShowEmergencyForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)

  const userForm = useForm<UserForm>()

  useEffect(() => {
    fetchUsers()
  }, [])

  // ページが表示される度にデータを再取得（ブラウザバック対応）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('ページが表示されました - ユーザーデータを再取得')
        fetchUsers(true)
      }
    }
    
    const handleUserCreated = () => {
      console.log('ユーザー作成イベントを受信 - データを再取得')
      fetchUsers(true)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('userCreated', handleUserCreated)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('userCreated', handleUserCreated)
    }
  }, [])

  const fetchUsers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')
      console.log('ユーザー一覧取得開始', forceRefresh ? '(強制更新)' : '')
      
      // 完全キャッシュ回避のリアルタイム取得
      const token = localStorage.getItem('token')
      const timestamp = Date.now()
      const response = await fetch(`/api/get-users?_=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('リアルタイムユーザー一覧取得:', result)
      console.log('レスポンス構造:', {
        status: response.status,
        dataType: typeof result.data,
        hasData: !!result.data,
        directData: Array.isArray(result.data)
      })
      
      const usersData = result.data
      console.log('処理後のユーザーデータ:', {
        type: typeof usersData,
        isArray: Array.isArray(usersData),
        length: Array.isArray(usersData) ? usersData.length : 'not array',
        sample: Array.isArray(usersData) ? usersData.slice(0, 2) : usersData
      })
      
      if (Array.isArray(usersData)) {
        setUsers(usersData)
        console.log(`ユーザー設定完了: ${usersData.length}件`)
      } else {
        console.warn('ユーザーデータが配列ではありません:', usersData)
        setUsers([])
      }
    } catch (error: any) {
      console.error('ユーザー取得エラー:', error)
      setError(error.response?.data?.message || error.message || 'ユーザーの取得に失敗しました')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: UserForm) => {
    try {
      setError('')
      console.log('ユーザー保存開始:', data)

      if (editingUser) {
        // ユーザー更新
        console.log('ユーザー更新開始:', editingUser.id, data)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify({ userId: editingUser.id, ...data })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('ユーザー更新完了:', result.data)
      } else {
        // ユーザー作成（既存の動作確認済みエンドポイントを使用）
        console.log('ユーザー作成開始:', data)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('ユーザー作成完了:', result.data)
        
        // 成功時は作成したユーザーを即座にリストに追加
        if (result.data) {
          const newUser = result.data
          setUsers(prevUsers => [...prevUsers, newUser])
          console.log('新しいユーザーを即座にリストに追加:', newUser.name)
        }
      }

      userForm.reset()
      setShowForm(false)
      setEditingUser(null)
      
      // リアルタイム更新：データ作成後即座に最新データを取得
      console.log('リアルタイム更新実行...')
      await fetchUsers(true)
      console.log('リアルタイム更新完了')
    } catch (error: any) {
      console.error('ユーザー保存エラー:', error)
      setError(error.response?.data?.message || 'ユーザーの保存に失敗しました')
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    userForm.setValue('email', user.email)
    userForm.setValue('name', user.name)
    userForm.setValue('role', user.role as 'USER' | 'ADMIN')
    userForm.setValue('groupId', user.groupId)
    setShowForm(true)
  }

  const handleDelete = async (user: UserData) => {
    if (!confirm(`「${user.name}」を削除しますか？`)) return

    try {
      setError('')
      console.log('ユーザー削除開始:', user.id)
      
      // メインのusersエンドポイントのDELETEメソッドを使用
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('ユーザー削除完了:', result)
      
      // ユーザーリストから即座に削除
      setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id))
      await fetchUsers(true)
    } catch (error: any) {
      console.error('ユーザー削除エラー:', error)
      setError(error.message || 'ユーザーの削除に失敗しました')
    }
  }

  const handleCancel = () => {
    userForm.reset()
    setShowForm(false)
    setEditingUser(null)
    setError('')
  }

  const handleEmergencyUserCreated = (newUser: UserData) => {
    setUsers(prevUsers => [...prevUsers, newUser])
    setShowEmergencyForm(false)
    fetchUsers(true)
  }

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          管理者
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        一般ユーザー
      </span>
    )
  }

  const getStatusBadge = (user: UserData) => {
    if (user.isFirstLogin) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          初回ログイン待ち
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        アクティブ
      </span>
    )
  }

  if (loading) {
    return (
      <AuthGuard requireAdmin>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">ユーザー情報を読み込み中...</p>
            </div>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="mt-2 text-gray-600">
              システムユーザーの作成、編集、削除を行います
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/users/bulk-create"
              className="btn-secondary"
            >
              一括作成
            </Link>
            <Link
              href="/admin/users/ultimate-create"
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 inline-block font-bold shadow-lg transform transition hover:scale-105"
            >
              🚀 究極ユーザー作成
            </Link>
            <Link
              href="/admin/users/create"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block"
            >
              ✅ 確実作成
            </Link>
            <button
              onClick={() => setShowEmergencyForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ⚡ モーダル
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
            <button 
              onClick={() => setError('')}
              className="mt-2 btn-primary text-sm"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 緊急ユーザー作成フォーム */}
        {showEmergencyForm && (
          <UnifiedUserForm
            onUserCreated={handleEmergencyUserCreated}
            onClose={() => setShowEmergencyForm(false)}
          />
        )}

        {/* ユーザー一覧テーブル */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    グループ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.group ? user.group.name : '未所属'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '未ログイン'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn-secondary text-sm px-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="btn-danger text-sm px-3"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">ユーザーがありません</h3>
              <p className="mt-1 text-sm text-gray-500">
                最初のユーザーを作成してください。
              </p>
              <div className="mt-6 space-x-3">
                <Link
                  href="/admin/users/ultimate-create"
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-600 inline-block font-bold shadow-lg transform transition hover:scale-105"
                >
                  🚀 究極ユーザー作成
                </Link>
                <Link
                  href="/admin/users/create"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block"
                >
                  ✅ 確実作成
                </Link>
                <button 
                  onClick={() => setShowEmergencyForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  ⚡ モーダル
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}