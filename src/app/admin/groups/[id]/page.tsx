'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { groupAPI, userAPI, Group, UserData } from '@/lib/api'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params?.id ? parseInt(params.id as string) : null
  
  const [group, setGroup] = useState<Group | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
    }
  }, [groupId])

  const fetchGroupData = async () => {
    if (!groupId) return
    
    try {
      setLoading(true)
      setError('')
      console.log('Fetching group:', groupId)
      
      const response = await groupAPI.getById(groupId)
      console.log('Group API response:', response.data)
      
      // APIレスポンス構造を処理
      const groupData = response.data?.data || response.data
      console.log('Processed group data:', groupData)
      
      if (groupData) {
        setGroup(groupData)
        setUsers(groupData.users || [])
      } else {
        setError('グループ情報の取得に失敗しました')
      }
    } catch (error: any) {
      console.error('Fetch group error:', error)
      if (error.response?.status === 404) {
        setError('指定されたグループが見つかりません')
      } else {
        setError(error.response?.data?.error || error.message || 'グループ情報の取得に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <AdminPageWrapper title="グループ詳細" description="グループの詳細情報とメンバー">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (error || !group) {
    return (
      <AdminPageWrapper title="グループ詳細" description="グループの詳細情報とメンバー">
        <div className="text-center py-12">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error || 'グループが見つかりません'}</p>
          </div>
          <button
            onClick={() => router.push('/admin/groups')}
            className="btn-primary"
          >
            グループ管理に戻る
          </button>
        </div>
      </AdminPageWrapper>
    )
  }

  return (
    <AdminPageWrapper title="グループ詳細" description="グループの詳細情報とメンバー">
      {/* グループ基本情報 */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">グループ名</label>
            <p className="text-gray-900 text-lg font-medium">{group.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">グループコード</label>
            <p className="text-gray-900 font-mono">{group.code}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
            <p className="text-gray-900">{group.description || '説明が設定されていません'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">作成日</label>
            <p className="text-gray-900">{formatDate(group.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">更新日</label>
            <p className="text-gray-900">{formatDate(group.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-gray-600">メンバー数</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => !u.isFirstLogin).length}
          </div>
          <div className="text-gray-600">ログイン済み</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.isFirstLogin).length}
          </div>
          <div className="text-gray-600">初回ログイン待ち</div>
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">メンバー一覧</h2>
          <span className="text-sm text-gray-500">{users.length}名</span>
        </div>
        
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役割
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ログイン状態
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
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'ADMIN' ? '管理者' : '受講者'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isFirstLogin ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.isFirstLogin ? '初回未完了' : 'ログイン済み'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : '未ログイン'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">このグループにはまだメンバーがいません</p>
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">操作</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/admin/groups/${group.id}/progress`)}
            className="btn-primary"
          >
            グループ進捗を表示
          </button>
          <button
            onClick={() => alert('グループ編集機能は実装中です')}
            className="btn-secondary"
          >
            グループ情報を編集
          </button>
          <button
            onClick={() => router.push('/admin/groups')}
            className="btn-outline"
          >
            グループ管理に戻る
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  )
}