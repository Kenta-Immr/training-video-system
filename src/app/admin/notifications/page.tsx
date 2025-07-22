'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { userAPI, UserData, groupAPI, Group } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

interface UserWithProgress extends UserData {
  progress?: {
    completionRate: number
    totalVideos: number
    completedVideos: number
    watchedVideos: number
    isDelayed: boolean
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'first-login' | 'inactive-users' | 'progress-delayed'>('first-login')
  const [firstLoginPendingUsers, setFirstLoginPendingUsers] = useState<UserWithProgress[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<UserWithProgress[]>([])
  const [progressDelayedUsers, setProgressDelayedUsers] = useState<UserWithProgress[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [daysSinceLogin, setDaysSinceLogin] = useState<number>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeTab, daysSinceLogin])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 基本的なデータセット（モック）を使用
      setGroups([
        { id: 1, name: 'グループA', code: 'GA001', description: 'サンプルグループA' },
        { id: 2, name: 'グループB', code: 'GB001', description: 'サンプルグループB' }
      ])
      
      setFirstLoginPendingUsers([
        { 
          id: 1, 
          name: '田中太郎', 
          email: 'tanaka@example.com', 
          role: 'USER', 
          isFirstLogin: true,
          createdAt: '2024-07-15T10:00:00Z',
          groupId: 1
        },
        { 
          id: 2, 
          name: '佐藤花子', 
          email: 'sato@example.com', 
          role: 'USER', 
          isFirstLogin: true,
          createdAt: '2024-07-10T10:00:00Z',
          groupId: 2
        }
      ])
      
      setInactiveUsers([
        { 
          id: 3, 
          name: '山田次郎', 
          email: 'yamada@example.com', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          lastLoginAt: '2024-07-05T10:00:00Z',
          groupId: 1
        }
      ])
      
      // 進捗遅れユーザー（20%以下の進捗率）
      setProgressDelayedUsers([
        { 
          id: 4, 
          name: '鈴木一郎', 
          email: 'suzuki@example.com', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          lastLoginAt: '2024-07-15T10:00:00Z',
          groupId: 1,
          progress: {
            completionRate: 15,
            totalVideos: 10,
            completedVideos: 1,
            watchedVideos: 2,
            isDelayed: true
          }
        },
        { 
          id: 5, 
          name: '高橋美子', 
          email: 'takahashi@example.com', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          lastLoginAt: '2024-07-16T10:00:00Z',
          groupId: 2,
          progress: {
            completionRate: 8,
            totalVideos: 10,
            completedVideos: 0,
            watchedVideos: 1,
            isDelayed: true
          }
        }
      ])
      
      setError('')
    } catch (error: any) {
      setError('データの取得に失敗しました')
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
    alert(`ユーザーID ${userId} にリマインダーメールを送信しました（実装予定）`)
  }

  const getFilteredUsers = (users: UserWithProgress[]) => {
    if (selectedGroupId === null) {
      return users
    }
    return users.filter(user => user.groupId === selectedGroupId)
  }

  const getProgressBackgroundColor = (user: UserWithProgress) => {
    if (!user.progress) return ''
    
    const { completionRate } = user.progress
    
    if (completionRate <= 10) {
      return 'bg-red-50 border-red-200' // 最も遅れ（赤色背景）
    } else if (completionRate <= 20) {
      return 'bg-orange-50 border-orange-200' // 大幅遅れ（オレンジ色背景）
    } else if (completionRate <= 30) {
      return 'bg-yellow-50 border-yellow-200' // 遅れ（黄色背景）
    }
    
    return '' // 正常（デフォルト背景）
  }

  const getProgressTextColor = (user: UserWithProgress) => {
    if (!user.progress) return 'text-gray-900'
    
    const { completionRate } = user.progress
    
    if (completionRate <= 10) {
      return 'text-red-900'
    } else if (completionRate <= 20) {
      return 'text-orange-900'
    } else if (completionRate <= 30) {
      return 'text-yellow-900'
    }
    
    return 'text-gray-900'
  }

  return (
    <AdminPageWrapper title="通知・アラート" description="ユーザーのログイン状況とアラート管理">
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
            <button
              onClick={() => setActiveTab('progress-delayed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'progress-delayed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 進捗遅れユーザー
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
            <p className="text-3xl font-bold text-red-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">7-29日</h3>
            <p className="text-3xl font-bold text-yellow-600">1</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">一度も未ログイン</h3>
            <p className="text-3xl font-bold text-gray-600">0</p>
          </div>
        </div>
      )}

      {activeTab === 'progress-delayed' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">進捗遅れユーザー</h3>
            <p className="text-3xl font-bold text-red-600">{getFilteredUsers(progressDelayedUsers).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">10%以下（緊急）</h3>
            <p className="text-3xl font-bold text-red-600">
              {getFilteredUsers(progressDelayedUsers).filter(user => user.progress && user.progress.completionRate <= 10).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">11-20%（警告）</h3>
            <p className="text-3xl font-bold text-orange-600">
              {getFilteredUsers(progressDelayedUsers).filter(user => user.progress && user.progress.completionRate > 10 && user.progress.completionRate <= 20).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">21-30%（注意）</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {getFilteredUsers(progressDelayedUsers).filter(user => user.progress && user.progress.completionRate > 20 && user.progress.completionRate <= 30).length}
            </p>
          </div>
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'first-login' && '初回ログイン未完了ユーザー一覧'}
            {activeTab === 'inactive-users' && '長期間未ログインユーザー一覧'}
            {activeTab === 'progress-delayed' && '進捗遅れユーザー一覧'}
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
                {getFilteredUsers(firstLoginPendingUsers).map((user) => {
                  const daysSince = getDaysSinceCreation(user.createdAt)
                  const urgency = getUrgencyLevel(daysSince)
                  
                  const bgColor = getProgressBackgroundColor(user)
                  const textColor = getProgressTextColor(user)
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        bgColor || 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${textColor}`}>{user.name}</div>
                        <div className={`text-sm ${textColor} opacity-80`}>{user.email}</div>
                        <div className={`text-xs ${textColor} opacity-70`}>作成から{daysSince}日経過</div>
                        {user.progress && (
                          <div className="mt-1">
                            <div className={`text-xs ${textColor} opacity-70`}>
                              進捗率: {user.progress.completionRate}%
                            </div>
                          </div>
                        )}
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
                {getFilteredUsers(inactiveUsers).map((user) => {
                  const bgColor = getProgressBackgroundColor(user)
                  const textColor = getProgressTextColor(user)
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        bgColor || 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${textColor}`}>{user.name}</div>
                        <div className={`text-sm ${textColor} opacity-80`}>{user.email}</div>
                        <div className={`text-xs ${textColor} opacity-70`}>
                          最終ログイン: {user.lastLoginAt ? formatDate(user.lastLoginAt) : '未ログイン'}
                        </div>
                        {user.progress && (
                          <div className="mt-1">
                            <div className={`text-xs ${textColor} opacity-70`}>
                              進捗率: {user.progress.completionRate}%
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          注意
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
          ) : activeTab === 'progress-delayed' ? (
            getFilteredUsers(progressDelayedUsers).length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    進捗遅れユーザーはいません
                  </h3>
                  <p className="text-gray-500">
                    すべてのユーザーが順調に学習を進めています。
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredUsers(progressDelayedUsers).map((user) => {
                  const bgColor = getProgressBackgroundColor(user)
                  const textColor = getProgressTextColor(user)
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex justify-between items-center p-4 border rounded-lg hover:shadow-md transition-shadow ${
                        bgColor || 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${textColor}`}>{user.name}</div>
                        <div className={`text-sm ${textColor} opacity-80`}>{user.email}</div>
                        {user.progress && (
                          <div className="mt-1 space-y-1">
                            <div className={`text-xs ${textColor} opacity-70`}>
                              進捗率: {user.progress.completionRate}% 
                              ({user.progress.completedVideos}/{user.progress.totalVideos}本完了)
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  user.progress.completionRate <= 10 ? 'bg-red-500' :
                                  user.progress.completionRate <= 20 ? 'bg-orange-500' :
                                  user.progress.completionRate <= 30 ? 'bg-yellow-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${user.progress.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {user.progress && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.progress.completionRate <= 10 ? 'bg-red-100 text-red-800' :
                            user.progress.completionRate <= 20 ? 'bg-orange-100 text-orange-800' :
                            user.progress.completionRate <= 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.progress.completionRate <= 10 ? '緊急' :
                             user.progress.completionRate <= 20 ? '警告' :
                             user.progress.completionRate <= 30 ? '注意' : '正常'}
                          </span>
                        )}
                        <button
                          onClick={() => sendReminderEmail(user.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          督促送信
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