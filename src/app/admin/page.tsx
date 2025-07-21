'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import AdminNavButton from '@/components/AdminNavButton'
import { logAPI } from '@/lib/api'

interface UserStat {
  id: number
  name: string
  email: string
  completedVideos: number
  totalVideos: number
  progressRate: number
  totalWatchedSeconds: number
}

interface StatsData {
  userStats: UserStat[]
  totalUsers: number
  totalVideos: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🔄 リアルタイム統計データ取得開始')
        
        // 新しいリアルタイム統計APIを使用
        const token = localStorage.getItem('token')
        const timestamp = Date.now()
        
        const response = await fetch(`/api/realtime-stats?_=${timestamp}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('✅ リアルタイム統計取得成功:', result)
        
        if (result.success && result.data) {
          const statsData = result.data
          setStats({
            userStats: Array.isArray(statsData.userStats) ? statsData.userStats : [],
            totalUsers: statsData.totalUsers || 0,
            totalVideos: statsData.totalVideos || 0
          })
          console.log(`📊 ダッシュボード更新: ユーザー${statsData.totalUsers}名, 動画${statsData.totalVideos}本`)
        } else {
          throw new Error(result.message || 'Invalid stats data format')
        }
      } catch (error: any) {
        console.warn('⚠️ リアルタイム統計取得失敗、古いAPIを試行:', error.message)
        
        // フォールバック: 古いAPIを試行
        try {
          const response = await logAPI.getStats()
          console.log('Stats API response:', response.data)
          
          // APIレスポンスの構造を確認
          const statsData = response.data?.data || response.data
          console.log('Stats data:', statsData)
          
          // データ構造を正規化
          if (statsData && typeof statsData === 'object') {
            setStats({
              userStats: Array.isArray(statsData.userStats) ? statsData.userStats : [],
              totalUsers: statsData.totalUsers || 0,
              totalVideos: statsData.totalVideos || 0
            })
          } else {
            throw new Error('Invalid stats data format')
          }
        } catch (fallbackError: any) {
          console.error('❌ 全ての統計API失敗、最新ユーザー数のみ取得を試行:', fallbackError.message)
          
          // 最終フォールバック: ユーザー数のみ取得
          try {
            const token = localStorage.getItem('token')
            const userResponse = await fetch(`/api/get-users?_=${Date.now()}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache'
              }
            })
            
            if (userResponse.ok) {
              const userData = await userResponse.json()
              const userCount = userData.success ? userData.count || userData.data?.length || 0 : 0
              
              console.log(`🔧 緊急対応: ユーザー数のみ取得成功 - ${userCount}名`)
              
              setStats({
                userStats: [],
                totalUsers: userCount,
                totalVideos: 0
              })
              setError(`統計データの一部のみ表示中（ユーザー数: ${userCount}名）`)
            } else {
              throw new Error('User count fetch failed')
            }
          } catch (finalError: any) {
            console.error('💥 全てのAPI失敗、デモデータを表示:', finalError.message)
            // 最後のデモデータ
            setStats({
              userStats: [
                {
                  id: 1,
                  name: 'データ取得エラー',
                  email: 'error@system.com',
                  completedVideos: 0,
                  totalVideos: 0,
                  progressRate: 0,
                  totalWatchedSeconds: 0
                }
              ],
              totalUsers: 1,
              totalVideos: 0
            })
            setError('統計データの取得に失敗しました。リアルタイムデータが利用できません。')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // 30秒ごとに自動更新
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}時間${mins}分`
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  // セーフティネット：statsが null の場合のデフォルト値
  const safeStats = stats || {
    userStats: [],
    totalUsers: 0,
    totalVideos: 0
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-gray-600">研修の進捗状況と視聴ログを管理します</p>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {safeStats && (
          <>
            {/* 概要統計 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-600">{safeStats.totalUsers}</div>
                <div className="text-gray-600">受講者数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{safeStats.totalVideos}</div>
                <div className="text-gray-600">総動画数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {safeStats.userStats && safeStats.userStats.length > 0 
                    ? Math.round(safeStats.userStats.reduce((sum, user) => sum + user.progressRate, 0) / safeStats.userStats.length)
                    : 0}%
                </div>
                <div className="text-gray-600">平均進捗率</div>
              </div>
            </div>

            {/* 管理メニュー */}
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">管理メニュー</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminNavButton
                  href="/admin/courses"
                  icon="📚"
                  title="コース管理"
                  description="コース・カリキュラム・動画・ファイルアップロード"
                  className="text-blue-600"
                />
                <AdminNavButton
                  href="/admin/progress"
                  icon="📊"
                  title="進捗管理"
                  description="個人・グループ別進捗確認"
                  className="text-green-600"
                />
                <AdminNavButton
                  href="/admin/users/manage"
                  icon="👥"
                  title="ユーザー管理"
                  description="ユーザー追加・編集・削除"
                  className="text-blue-600"
                />
                <AdminNavButton
                  href="/admin/users/bulk-create"
                  icon="📝"
                  title="一括ユーザー作成"
                  description="CSV・手動入力でユーザー一括追加"
                  className="text-cyan-600"
                />
                <AdminNavButton
                  href="/admin/videos"
                  icon="🎥"
                  title="動画ログ"
                  description="動画別視聴状況"
                  className="text-purple-600"
                />
                <AdminNavButton
                  href="/admin/reports"
                  icon="📈"
                  title="レポート"
                  description="詳細分析・エクスポート"
                  className="text-orange-600"
                />
                <AdminNavButton
                  href="/admin/groups"
                  icon="👥"
                  title="グループ管理"
                  description="受講者のグループ分け"
                  className="text-indigo-600"
                />
                <AdminNavButton
                  href="/admin/notifications"
                  icon="🔔"
                  title="通知・アラート"
                  description="初回ログイン未完了ユーザー管理"
                  className="text-red-600"
                />
              </div>
            </div>

            {/* ユーザー進捗一覧 */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">受講者進捗一覧</h2>
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  詳細を見る →
                </Link>
              </div>

              {safeStats.userStats && safeStats.userStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          受講者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          進捗率
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          完了動画
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          総視聴時間
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(safeStats.userStats || []).slice(0, 10).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 mr-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${user.progressRate}%` }}
                                  ></div>
                                </div>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProgressColor(user.progressRate)}`}>
                                {user.progressRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.completedVideos} / {user.totalVideos}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(user.totalWatchedSeconds)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              詳細
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">受講者データがありません</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AuthGuard>
  )
}