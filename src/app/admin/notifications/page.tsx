'use client'

// 通知ページはリアルタイムユーザー情報が必要
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
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
      setGroups([
        { id: 1, name: 'グループA', code: 'GA001', description: 'サンプルグループA', createdAt: '', updatedAt: '' },
        { id: 2, name: 'グループB', code: 'GB001', description: 'サンプルグループB', createdAt: '', updatedAt: '' }
      ])
      
      setFirstLoginPendingUsers([
        { 
          id: 1, 
          name: '田中太郎', 
          userId: 'tanaka_taro', 
          role: 'USER', 
          isFirstLogin: true,
          createdAt: '2024-07-15T10:00:00Z',
          updatedAt: '',
          groupId: 1
        },
        { 
          id: 2, 
          name: '佐藤花子', 
          userId: 'sato_hanako', 
          role: 'USER', 
          isFirstLogin: true,
          createdAt: '2024-07-10T10:00:00Z',
          updatedAt: '',
          groupId: 2
        }
      ])
      
      setInactiveUsers([
        { 
          id: 3, 
          name: '山田次郎', 
          userId: 'yamada_jiro', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          updatedAt: '',
          lastLoginAt: '2024-07-05T10:00:00Z',
          groupId: 1
        }
      ])
      
      setProgressDelayedUsers([
        { 
          id: 4, 
          name: '鈴木一郎', 
          userId: 'suzuki_ichiro', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          updatedAt: '',
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
          userId: 'takahashi_miko', 
          role: 'USER', 
          isFirstLogin: false,
          createdAt: '2024-07-01T10:00:00Z',
          updatedAt: '',
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
      return 'bg-red-50 border-red-200'
    } else if (completionRate <= 20) {
      return 'bg-orange-50 border-orange-200'
    } else if (completionRate <= 30) {
      return 'bg-yellow-50 border-yellow-200'
    }
    
    return ''
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
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">通知・アラート</h1>
          <p className="mt-2 text-gray-600">ユーザーのログイン状況とアラート管理</p>
        </div>

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
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'first-login' && '初回ログイン未完了ユーザー一覧'}
              {activeTab === 'inactive-users' && '長期間未ログインユーザー一覧'}
              {activeTab === 'progress-delayed' && '進捗遅れユーザー一覧'}
            </h2>
          </div>

          <div className="p-6">
            {activeTab === 'first-login' && (
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
                        <div className={`text-sm ${textColor} opacity-80`}>{user.userId}</div>
                        <div className={`text-xs ${textColor} opacity-70`}>作成から{daysSince}日経過</div>
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
            )}

            {activeTab === 'progress-delayed' && (
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
                        <div className={`text-sm ${textColor} opacity-80`}>{user.userId}</div>
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
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}