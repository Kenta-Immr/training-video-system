'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { userAPI, groupAPI, UserData, CreateUserRequest, UpdateUserRequest, Group } from '@/lib/api'

export default function UserManagePage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<UserData | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserRequest & { groupId: string }>()

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<{ newPassword: string; confirmPassword: string }>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersResponse, groupsResponse] = await Promise.all([
        userAPI.getAll(),
        groupAPI.getAll()
      ])
      
      console.log('Users API response:', usersResponse.data)
      console.log('Groups API response:', groupsResponse.data)
      
      // APIレスポンス構造を処理
      const usersData = usersResponse.data?.data || usersResponse.data
      const groupsData = groupsResponse.data?.data || groupsResponse.data
      
      console.log('Processed users data:', usersData)
      console.log('Processed groups data:', groupsData)
      
      setUsers(Array.isArray(usersData) ? usersData : [])
      setGroups(Array.isArray(groupsData) ? groupsData : [])
    } catch (error: any) {
      console.error('Fetch data error:', error)
      setError(error.response?.data?.error || 'データの取得に失敗しました')
      setUsers([])
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateUserRequest & { groupId: string }) => {
    try {
      setError('')
      const groupId = data.groupId === '' ? undefined : parseInt(data.groupId)
      const token = localStorage.getItem('token')
      
      if (editingUser) {
        // ユーザー更新
        const updateData: UpdateUserRequest & { userId: number; groupId?: number } = {
          userId: editingUser.id,
          userId: data.userId,
          name: data.name,
          role: data.role,
          groupId
        }
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password
        }

        console.log('ユーザー更新開始:', updateData)
        const response = await fetch('/api/update-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        console.log('ユーザー更新完了')
      } else {
        // ユーザー作成（既存の動作確認済みエンドポイントを使用）
        const createData: CreateUserRequest & { groupId?: number } = {
          userId: data.userId,
          name: data.name,
          password: data.password,
          role: data.role,
          groupId
        }

        console.log('ユーザー作成開始:', createData)
        const response = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          body: JSON.stringify(createData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('ユーザー作成APIエラー詳細:', {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
            url: response.url,
            requestData: createData
          })
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
        }

        console.log('ユーザー作成完了')
      }
      
      reset()
      setShowForm(false)
      setEditingUser(null)
      fetchData()
    } catch (error: any) {
      console.error('ユーザー保存エラー:', error)
      setError(error.message || 'ユーザーの保存に失敗しました')
    }
  }

  const onSubmitPasswordReset = async (data: { newPassword: string; confirmPassword: string }) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (!showPasswordReset) return

    try {
      await userAPI.resetPassword(showPasswordReset.id, data.newPassword)
      resetPassword()
      setShowPasswordReset(null)
      alert('パスワードが正常にリセットされました')
    } catch (error: any) {
      setError(error.response?.data?.error || 'パスワードのリセットに失敗しました')
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user)
    setValue('userId', user.userId)
    setValue('name', user.name)
    setValue('role', user.role)
    setValue('groupId', user.groupId ? user.groupId.toString() : '')
    setValue('password', '') // パスワードは空にする
    setShowForm(true)
  }

  const handleDelete = async (user: UserData) => {
    if (!confirm(`「${user.name}」を削除しますか？\n※関連する視聴ログも削除されます。`)) return

    try {
      setError('')
      console.log('統一API経由でユーザー削除開始:', user.id)
      
      // 統一管理APIエンドポイントを使用
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ 
          action: 'deleteUser',
          userId: user.id 
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('ユーザー削除完了:', result)
      
      // データを再取得
      fetchData()
    } catch (error: any) {
      console.error('ユーザー削除エラー:', error)
      setError(error.message || 'ユーザーの削除に失敗しました')
    }
  }

  const handlePasswordReset = (user: UserData) => {
    setShowPasswordReset(user)
    resetPassword()
  }

  const handleCancel = () => {
    reset()
    setShowForm(false)
    setEditingUser(null)
  }

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        管理者
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        受講者
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
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        アクティブ
      </span>
    )
  }

  return (
    <AdminPageWrapper 
      title="ユーザー管理" 
      description="ユーザーの作成、編集、削除を行います"
    >

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
              <p className="mt-2 text-gray-600">ユーザーの追加・編集・削除・パスワードリセット</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/users/bulk-create"
                className="btn-secondary"
              >
                一括作成
              </Link>
              <Link
                href="/admin/groups"
                className="btn-secondary"
              >
                グループ管理
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                新規ユーザー追加
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-2 text-sm text-red-600 underline"
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
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">ユーザーID</label>
                  <input
                    {...register('userId', { 
                      required: 'ユーザーIDは必須です'
                    })}
                    type="text"
                    className="form-input"
                    placeholder="user_id"
                  />
                  {errors.userId && (
                    <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">ユーザー名</label>
                  <input
                    {...register('name', { required: 'ユーザー名は必須です' })}
                    className="form-input"
                    placeholder="ユーザー名を入力"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">権限</label>
                  <select
                    {...register('role')}
                    className="form-input"
                  >
                    <option value="USER">受講者</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">グループ</label>
                  <select
                    {...register('groupId')}
                    className="form-input"
                  >
                    <option value="">グループなし</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id.toString()}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    受講生は自己登録時にグループ名をコードとして入力できます
                  </p>
                </div>

                <div>
                  <label className="form-label">
                    パスワード {editingUser && <span className="text-gray-500 text-xs">(変更しない場合は空欄)</span>}
                  </label>
                  <input
                    {...register('password', editingUser ? {} : { 
                      required: 'パスワードは必須です',
                      minLength: {
                        value: 4,
                        message: 'パスワードは4文字以上で入力してください',
                      }
                    })}
                    type="password"
                    className="form-input"
                    placeholder="パスワードを入力"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isSubmitting ? '保存中...' : '保存'}
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

        {/* パスワードリセットフォーム */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                パスワードリセット - {showPasswordReset.name}
              </h2>
              
              <form onSubmit={handleSubmitPassword(onSubmitPasswordReset)} className="space-y-4">
                <div>
                  <label className="form-label">新しいパスワード</label>
                  <input
                    {...registerPassword('newPassword', { 
                      required: '新しいパスワードは必須です',
                      minLength: {
                        value: 4,
                        message: 'パスワードは4文字以上で入力してください',
                      }
                    })}
                    type="password"
                    className="form-input"
                    placeholder="新しいパスワードを入力"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">パスワード確認</label>
                  <input
                    {...registerPassword('confirmPassword', { 
                      required: 'パスワード確認は必須です'
                    })}
                    type="password"
                    className="form-input"
                    placeholder="パスワードを再入力"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isPasswordSubmitting ? 'リセット中...' : 'パスワードリセット'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(null)}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ユーザー一覧 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー情報
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
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.userId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.group ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.group.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">未設定</span>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handlePasswordReset(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          パスワードリセット
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">ユーザーが登録されていません</p>
              </div>
            )}
          </div>
        )}
    </AdminPageWrapper>
  )
}