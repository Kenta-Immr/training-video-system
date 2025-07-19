'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AuthGuard from '@/components/AuthGuard'
import { userAPI, UserData, groupAPI, Group } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'first-login' | 'inactive-users'>('first-login')
  const [firstLoginPendingUsers, setFirstLoginPendingUsers] = useState<UserData[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<UserData[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [daysSinceLogin, setDaysSinceLogin] = useState<number>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 管理者チェック
  if (!isAdmin()) {
    router.push('/')
    return null
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, daysSinceLogin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [groupsResponse, usersResponse, firstLoginResponse] = await Promise.all([
        groupAPI.getAll(),
        userAPI.getAll(),
        userAPI.getFirstLoginPending()
      ])
      
      setGroups(groupsResponse.data)
      setFirstLoginPendingUsers(firstLoginResponse.data)
      
      // 非アクティブユーザーを計算
      const now = new Date()
      const cutoffDate = new Date(now.getTime() - daysSinceLogin * 24 * 60 * 60 * 1000)
      
      const inactive = usersResponse.data.filter(user => {
        if (!user.lastLoginAt) return true // 一度もログインしていない
        const lastLogin = new Date(user.lastLoginAt)
        return lastLogin < cutoffDate
      })
      
      setInactiveUsers(inactive)
      setError('')
    } catch (error: any) {
      setError(error.response?.data?.error || 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getDaysSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyLevel = (daysSince: number) => {
    if (daysSince >= 7) return { level: 'high', color: 'bg-red-100 text-red-800', label: '緊急' }
    if (daysSince >= 3) return { level: 'medium', color: 'bg-yellow-100 text-yellow-800', label: '注意' }
    return { level: 'low', color: 'bg-green-100 text-green-800', label: '通常' }
  }

  const sendReminderEmail = async (userId: number) => {
    // 実際の実装では、メール送信APIを呼び出す
    alert(`ユーザーID ${userId} にリマインダーメールを送信しました（実装予定）`)
  }

  const getFilteredUsers = (users: UserData[]) => {
    if (selectedGroupId === null) {
      return users
    }
    return users.filter(user => user.groupId === selectedGroupId)
  }

  const getDaysSinceLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return '未ログイン'
    const lastLogin = new Date(lastLoginAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays}日前`
  }

  if (loading) {
    return (
      <AuthGuard requireAdmin>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">通知・アラート</h1>
              <p className="mt-2 text-gray-600">
                ユーザーのログイン状況とアラート管理
              </p>
            </div>
            <Link
              href="/admin"
              className="btn-secondary"
            >
              管理画面に戻る
            </Link>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('first-login')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'first-login'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔐 初回ログイン未完了
              </button>
              <button
                onClick={() => setActiveTab('inactive-users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inactive-users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⏰ 長期間未ログイン
              </button>
            </nav>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">グループフィルター</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                className="form-input"
              >
                <option value="">すべてのグループ</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'inactive-users' && (
              <div>
                <label className="form-label">未ログイン日数</label>
                <select
                  value={daysSinceLogin}
                  onChange={(e) => setDaysSinceLogin(parseInt(e.target.value))}
                  className="form-input"
                >
                  <option value={3}>3日以上</option>
                  <option value={7}>7日以上</option>
                  <option value={14}>14日以上</option>
                  <option value={30}>30日以上</option>
                  <option value={60}>60日以上</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 概要統計 */}
        {activeTab === 'first-login' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">初回ログイン未完了</h3>
              <p className="text-3xl font-bold text-red-600">{getFilteredUsers(firstLoginPendingUsers).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">7日以上経過</h3>
              <p className="text-3xl font-bold text-red-600">
                {getFilteredUsers(firstLoginPendingUsers).filter(user => getDaysSinceCreation(user.createdAt) >= 7).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">3-6日経過</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {getFilteredUsers(firstLoginPendingUsers).filter(user => {
                  const days = getDaysSinceCreation(user.createdAt)
                  return days >= 3 && days < 7
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">2日以内</h3>
              <p className="text-3xl font-bold text-green-600">
                {getFilteredUsers(firstLoginPendingUsers).filter(user => getDaysSinceCreation(user.createdAt) < 3).length}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'inactive-users' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">長期間未ログイン</h3>
              <p className="text-3xl font-bold text-red-600">{getFilteredUsers(inactiveUsers).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">30日以上</h3>
              <p className="text-3xl font-bold text-red-600">
                {getFilteredUsers(inactiveUsers).filter(user => {
                  if (!user.lastLoginAt) return true
                  const days = Math.ceil((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
                  return days >= 30
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">7-29日</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {getFilteredUsers(inactiveUsers).filter(user => {
                  if (!user.lastLoginAt) return false
                  const days = Math.ceil((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
                  return days >= 7 && days < 30
                }).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">一度も未ログイン</h3>
              <p className="text-3xl font-bold text-gray-600">
                {getFilteredUsers(inactiveUsers).filter(user => !user.lastLoginAt).length}
              </p>
            </div>
          </div>
        )}

        {/* ユーザー一覧 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'first-login' ? '初回ログイン未完了ユーザー一覧' : '長期間未ログインユーザー一覧'}
              {selectedGroupId && (
                <span className="ml-2 text-sm text-gray-600">
                  ({groups.find(g => g.id === selectedGroupId)?.name})
                </span>
              )}
            </h2>
          </div>

          {activeTab === 'first-login' && getFilteredUsers(firstLoginPendingUsers).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  すべてのユーザーがログイン済みです
                </h3>
                <p className="text-gray-500">
                  初回ログインが完了していないユーザーはいません。
                </p>
              </div>
            </div>
          ) : activeTab === 'first-login' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      グループ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アカウント作成日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      経過日数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      優先度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredUsers(firstLoginPendingUsers)
                    .sort((a, b) => getDaysSinceCreation(b.createdAt) - getDaysSinceCreation(a.createdAt))
                    .map((user) => {
                      const daysSince = getDaysSinceCreation(user.createdAt)
                      const urgency = getUrgencyLevel(daysSince)
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.group ? user.group.name : 'グループなし'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {daysSince}日
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${urgency.color}`}>
                              {urgency.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => sendReminderEmail(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              リマインダー送信
                            </button>
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              詳細
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'inactive-users' && getFilteredUsers(inactiveUsers).length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  該当するユーザーはいません
                </h3>
                <p className="text-gray-500">
                  設定した期間内に未ログインのユーザーはいません。
                </p>
              </div>
            </div>
          ) : activeTab === 'inactive-users' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      グループ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最終ログイン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      経過期間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredUsers(inactiveUsers)
                    .sort((a, b) => {
                      const aDate = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
                      const bDate = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
                      return aDate - bDate
                    })
                    .map((user) => {
                      const isNeverLoggedIn = !user.lastLoginAt
                      const daysSince = isNeverLoggedIn ? '未ログイン' : Math.ceil((Date.now() - new Date(user.lastLoginAt!).getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.group ? user.group.name : 'グループなし'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isNeverLoggedIn ? '未ログイン' : formatDate(user.lastLoginAt!)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {typeof daysSince === 'number' ? `${daysSince}日` : daysSince}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isNeverLoggedIn ? 'bg-gray-100 text-gray-800' :
                              typeof daysSince === 'number' && daysSince >= 30 ? 'bg-red-100 text-red-800' :
                              typeof daysSince === 'number' && daysSince >= 7 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isNeverLoggedIn ? '未ログイン' :
                               typeof daysSince === 'number' && daysSince >= 30 ? '要注意' :
                               typeof daysSince === 'number' && daysSince >= 7 ? '注意' : '通常'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => sendReminderEmail(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              リマインダー送信
                            </button>
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              詳細
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* アクションパネル */}
        {((activeTab === 'first-login' && getFilteredUsers(firstLoginPendingUsers).length > 0) || 
          (activeTab === 'inactive-users' && getFilteredUsers(inactiveUsers).length > 0)) && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">一括アクション</h3>
            <div className="space-y-4">
              {activeTab === 'first-login' ? (
                <>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        すべての未ログインユーザーにリマインダーを送信
                      </h4>
                      <p className="text-sm text-gray-500">
                        初回ログインが完了していない全ユーザーにメールを送信します
                      </p>
                    </div>
                    <button
                      onClick={() => alert('一括リマインダーメール送信機能（実装予定）')}
                      className="btn-primary"
                    >
                      一括送信
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        7日以上経過ユーザーに緊急リマインダーを送信
                      </h4>
                      <p className="text-sm text-gray-500">
                        アカウント作成から7日以上経過したユーザーに緊急メールを送信します
                      </p>
                    </div>
                    <button
                      onClick={() => alert('緊急リマインダーメール送信機能（実装予定）')}
                      className="btn-primary bg-yellow-600 hover:bg-yellow-700"
                      disabled={getFilteredUsers(firstLoginPendingUsers).filter(user => getDaysSinceCreation(user.createdAt) >= 7).length === 0}
                    >
                      緊急送信
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        すべての長期間未ログインユーザーにリマインダーを送信
                      </h4>
                      <p className="text-sm text-gray-500">
                        設定した期間以上ログインしていない全ユーザーにメールを送信します
                      </p>
                    </div>
                    <button
                      onClick={() => alert('一括リマインダーメール送信機能（実装予定）')}
                      className="btn-primary"
                    >
                      一括送信
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        30日以上未ログインユーザーに緊急リマインダーを送信
                      </h4>
                      <p className="text-sm text-gray-500">
                        30日以上ログインしていないユーザーに緊急メールを送信します
                      </p>
                    </div>
                    <button
                      onClick={() => alert('緊急リマインダーメール送信機能（実装予定）')}
                      className="btn-primary bg-red-600 hover:bg-red-700"
                      disabled={getFilteredUsers(inactiveUsers).filter(user => {
                        if (!user.lastLoginAt) return true
                        const days = Math.ceil((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
                        return days >= 30
                      }).length === 0}
                    >
                      緊急送信
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}