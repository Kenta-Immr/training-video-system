'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { userAPI, UserData, groupAPI, Group } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

// 動的ページとして設定
export const dynamic = 'force-dynamic'

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

  console.log('🔔 NotificationsPage component is rendering')
  console.log('🔔 Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')
  
  // 管理者チェック（クライアントサイドのみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [activeTab, daysSinceLogin])

  const fetchData = async () => {
    setLoading(true)
    try {
      console.log('🔔 Fetching notification data...')
      const [groupsResponse, usersResponse, firstLoginResponse] = await Promise.all([
        groupAPI.getAll(),
        userAPI.getAll(),
        userAPI.getFirstLoginPending()
      ])
      
      console.log('🔔 Groups API response:', groupsResponse.data)
      console.log('🔔 Users API response:', usersResponse.data)
      console.log('🔔 First login response:', firstLoginResponse.data)
      
      // APIレスポンス構造を処理
      const groupsData = groupsResponse.data?.data || groupsResponse.data
      const usersData = usersResponse.data?.data || usersResponse.data
      const firstLoginData = firstLoginResponse.data?.data || firstLoginResponse.data
      
      console.log('🔔 Processed groups data:', groupsData)
      console.log('🔔 Processed users data:', usersData)
      console.log('🔔 Processed first login data:', firstLoginData)
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      setFirstLoginPendingUsers(Array.isArray(firstLoginData) ? firstLoginData : [])
      
      // 非アクティブユーザーを計算
      const now = new Date()
      const cutoffDate = new Date(now.getTime() - daysSinceLogin * 24 * 60 * 60 * 1000)
      
      const inactive = (Array.isArray(usersData) ? usersData : []).filter(user => {
        if (!user.lastLoginAt) return true // 一度もログインしていない
        const lastLogin = new Date(user.lastLoginAt)
        return lastLogin < cutoffDate
      })
      
      setInactiveUsers(inactive)
      setError('')
    } catch (error: any) {
      console.error('🔔 Fetch data error:', error)
      setError(error.response?.data?.error || 'データの取得に失敗しました')
      // エラー時も空データでフォールバック
      setGroups([])
      setFirstLoginPendingUsers([])
      setInactiveUsers([])
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
      <AdminPageWrapper title="通知・アラート" description="ユーザーのログイン状況とアラート管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageWrapper>
    )
  }

  console.log('🔔 About to render NotificationsPage content')

  return (
    <AdminPageWrapper title="通知・アラート" description="ユーザーのログイン状況とアラート管理">
      {/* デバッグ情報 - このページが確実に通知アラートページであることを確認 */}
      <div className="bg-green-50 border border-green-200 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ 通知・アラートページが正常に読み込まれました</h2>
        <div className="text-sm text-green-700 space-y-1">
          <p>• コンポーネント名: NotificationsPage</p>
          <p>• 現在のパス: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
          <p>• 初回ログイン未完了ユーザー: {firstLoginPendingUsers.length}名</p>
          <p>• 非アクティブユーザー: {inactiveUsers.length}名</p>
          <p>• 登録グループ数: {groups.length}個</p>
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

      {/* 簡略化されたユーザー一覧表示 */}
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

        <div className="p-6">
          {activeTab === 'first-login' ? (
            getFilteredUsers(firstLoginPendingUsers).length === 0 ? (
              <div className="text-center py-8">
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
            ) : (
              <div className="space-y-4">
                {getFilteredUsers(firstLoginPendingUsers).slice(0, 10).map((user) => {
                  const daysSince = getDaysSinceCreation(user.createdAt)
                  const urgency = getUrgencyLevel(daysSince)
                  
                  return (
                    <div key={user.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">作成から{daysSince}日経過</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${urgency.color}`}>
                          {urgency.label}
                        </span>
                        <button
                          onClick={() => sendReminderEmail(user.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          リマインダー送信
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            getFilteredUsers(inactiveUsers).length === 0 ? (
              <div className="text-center py-8">
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
            ) : (
              <div className="space-y-4">
                {getFilteredUsers(inactiveUsers).slice(0, 10).map((user) => {
                  const isNeverLoggedIn = !user.lastLoginAt
                  const daysSince = isNeverLoggedIn ? '未ログイン' : Math.ceil((Date.now() - new Date(user.lastLoginAt!).getTime()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={user.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">
                          {isNeverLoggedIn ? '未ログイン' : `${daysSince}日前にログイン`}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
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
                        <button
                          onClick={() => sendReminderEmail(user.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          リマインダー送信
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </AdminPageWrapper>
  )
}