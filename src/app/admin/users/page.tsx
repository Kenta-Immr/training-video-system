'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { userAPI, UserData } from '@/lib/api'

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
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchUsers = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')
      console.log('ユーザー一覧取得開始', forceRefresh ? '(強制更新)' : '')
      
      const response = await userAPI.getAll()
      console.log('ユーザー一覧API応答:', response)
      console.log('レスポンス構造:', {
        status: response.status,
        dataType: typeof response.data,
        hasData: !!response.data?.data,
        directData: Array.isArray(response.data)
      })
      
      const usersData = response.data?.data || response.data
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
        await userAPI.update(editingUser.id, data)
        console.log('ユーザー更新完了')
      } else {
        await userAPI.create(data)
        console.log('ユーザー作成完了')
      }

      userForm.reset()
      setShowForm(false)
      setEditingUser(null)
      
      // データ保存後の強制リフレッシュ（遅延付き）
      setTimeout(() => {
        fetchUsers(true)
      }, 500)
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
      await userAPI.delete(user.id)
      fetchUsers()
    } catch (error: any) {
      console.error('ユーザー削除エラー:', error)
      setError(error.response?.data?.message || 'ユーザーの削除に失敗しました')
    }
  }

  const handleCancel = () => {
    userForm.reset()
    setShowForm(false)
    setEditingUser(null)
    setError('')
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
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              新規ユーザー作成
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

        {/* ユーザー作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
              </h2>
              
              <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">メールアドレス</label>
                  <input
                    {...userForm.register('email', { 
                      required: 'メールアドレスは必須です',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '有効なメールアドレスを入力してください'
                      }
                    })}
                    type="email"
                    className="form-input"
                    placeholder="user@example.com"
                  />
                  {userForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">名前</label>
                  <input
                    {...userForm.register('name', { required: '名前は必須です' })}
                    className="form-input"
                    placeholder="山田太郎"
                  />
                  {userForm.formState.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{userForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">権限</label>
                  <select
                    {...userForm.register('role')}
                    className="form-input"
                  >
                    <option value="USER">一般ユーザー</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">グループID（任意）</label>
                  <select
                    {...userForm.register('groupId')}
                    className="form-input"
                  >
                    <option value="">グループを選択</option>
                    <option value="1">管理グループ</option>
                    <option value="2">開発チーム</option>
                    <option value="3">営業チーム</option>
                  </select>
                </div>

                {!editingUser && (
                  <div>
                    <label className="form-label">初期パスワード（任意）</label>
                    <input
                      {...userForm.register('password')}
                      type="password"
                      className="form-input"
                      placeholder="未入力の場合は自動生成されます"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      最初のログイン時にパスワード変更が必要です
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={userForm.formState.isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {userForm.formState.isSubmitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
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
              <div className="mt-6">
                <button 
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  新規ユーザー作成
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}