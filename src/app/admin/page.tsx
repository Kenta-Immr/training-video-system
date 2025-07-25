'use client'

// 管理者ダッシュボードは常に最新データが必要
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
  averageProgress: number
  activeUsers: number
  totalWatchTime: number
  dataIntegrity: {
    usersIntact: boolean
    videosIntact: boolean
    coursesIntact: boolean
    logsIntact: boolean
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('📊 実際のログデータに基づく進捗統計取得開始')
        
        const token = localStorage.getItem('token')
        const timestamp = Date.now()
        
        // 新しいリアル進捗統計APIを使用
        const response = await fetch(`/api/real-progress-stats?_=${timestamp}`, {
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
        console.log('✅ リアル進捗統計取得成功:', result)
        
        if (result.success && result.data) {
          const statsData = result.data
          const summary = statsData.summary || {}
          const userStats = statsData.userStats || []
          
          setStats({
            userStats: userStats,
            totalUsers: summary.totalUsers || 0,
            totalVideos: summary.totalVideos || 0,
            averageProgress: summary.averageProgress || 0,
            activeUsers: summary.activeUsers || 0,
            totalWatchTime: summary.totalWatchTimeHours || 0,
            dataIntegrity: statsData.dataIntegrity
          })
          
          console.log(`📊 ダッシュボード更新完了:`, {
            ユーザー数: summary.totalUsers,
            動画数: summary.totalVideos,
            平均進捗率: summary.averageProgress + '%',
            アクティブユーザー: summary.activeUsers,
            総視聴時間: summary.totalWatchTimeHours + '時間'
          })
          
          // データ整合性の警告表示
          const integrity = statsData.dataIntegrity || {}
          const issues = []
          
          if (!integrity.usersIntact) issues.push('ユーザーデータ')
          if (!integrity.videosIntact) issues.push('動画データ') 
          if (!integrity.coursesIntact) issues.push('コースデータ')
          if (!integrity.logsIntact) issues.push('視聴ログ')
          
          if (issues.length > 0) {
            setError(`⚠️ ${issues.join('・')}の整合性を確認中です。システムは正常に動作しています。`)
          } else {
            setError('') // エラーをクリア
          }
          
        } else {
          throw new Error(result.message || 'Invalid real progress stats data format')
        }
        
      } catch (error: any) {
        console.warn('⚠️ リアル進捗統計取得失敗、フォールバック処理:', error.message)
        
        // フォールバック1: 基本統計のみ取得
        try {
          const token = localStorage.getItem('token')
          
          const [userResponse, courseResponse] = await Promise.all([
            fetch(`/api/get-users?_=${Date.now()}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            }),
            fetch(`/api/courses?_=${Date.now()}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
            })
          ])
          
          const userData = userResponse.ok ? await userResponse.json() : { data: [] }
          const courseData = courseResponse.ok ? await courseResponse.json() : { data: [] }
          
          const userCount = userData.success ? userData.count || userData.data?.length || 0 : 0
          
          // コースから動画数を計算
          let videoCount = 0
          if (courseData.success && courseData.data) {
            courseData.data.forEach(course => {
              if (course.curriculums) {
                course.curriculums.forEach(curriculum => {
                  if (curriculum.videos) {
                    videoCount += curriculum.videos.length
                  }
                })
              }
            })
          }
          
          console.log(`🔧 フォールバック統計: ユーザー${userCount}名, 動画${videoCount}本`)
          
          setStats({
            userStats: [],
            totalUsers: userCount,
            totalVideos: videoCount,
            averageProgress: 0,
            activeUsers: 0,
            totalWatchTime: 0
          })
          setError(`基本統計のみ表示中 - ログデータとの同期が必要です（ユーザー: ${userCount}名, 動画: ${videoCount}本）`)
          
        } catch (fallbackError: any) {
          console.error('💥 全ての統計取得失敗:', fallbackError.message)
          
          setStats({
            userStats: [],
            totalUsers: 0,
            totalVideos: 0,
            averageProgress: 0,
            activeUsers: 0,
            totalWatchTime: 0
          })
          setError('統計データの取得に失敗しました。データ保護システムを確認してください。')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // 60秒ごとに自動更新（実データは重いため間隔を長めに）
    const interval = setInterval(fetchStats, 60000)
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
    if (rate >= 20) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getRowBackgroundColor = (rate: number) => {
    if (rate <= 10) return 'bg-red-50 border-l-4 border-red-500'
    if (rate <= 20) return 'bg-orange-50 border-l-4 border-orange-500'
    if (rate <= 30) return 'bg-yellow-50 border-l-4 border-yellow-500'
    return 'hover:bg-gray-50'
  }

  const getProgressStatus = (rate: number) => {
    if (rate <= 10) return { label: '緊急', color: 'bg-red-100 text-red-800' }
    if (rate <= 20) return { label: '遅れ', color: 'bg-orange-100 text-orange-800' }
    if (rate <= 30) return { label: '注意', color: 'bg-yellow-100 text-yellow-800' }
    if (rate < 70) return { label: '通常', color: 'bg-blue-100 text-blue-800' }
    return { label: '順調', color: 'bg-green-100 text-green-800' }
  }

  // セーフティネット：statsが null の場合のデフォルト値
  const safeStats = stats || {
    userStats: [],
    totalUsers: 0,
    totalVideos: 0,
    averageProgress: 0,
    activeUsers: 0,
    totalWatchTime: 0,
    dataIntegrity: {
      usersIntact: false,
      videosIntact: false,
      coursesIntact: false,
      logsIntact: false
    }
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-600">{safeStats.totalUsers}</div>
                <div className="text-gray-600">受講者数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{safeStats.totalVideos}</div>
                <div className="text-gray-600">総動画数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-purple-600">{safeStats.averageProgress}%</div>
                <div className="text-gray-600">平均進捗率</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-red-600">
                  {safeStats.userStats ? safeStats.userStats.filter(user => user.progressRate <= 20).length : 0}
                </div>
                <div className="text-gray-600">遅れユーザー</div>
                <div className="text-xs text-gray-500 mt-1">20%以下</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {safeStats.userStats ? safeStats.userStats.filter(user => user.progressRate > 20 && user.progressRate <= 30).length : 0}
                </div>
                <div className="text-gray-600">注意ユーザー</div>
                <div className="text-xs text-gray-500 mt-1">21-30%</div>
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
                  href="/admin/users/manage"
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
                      {(safeStats.userStats || [])
                        .sort((a, b) => a.progressRate - b.progressRate) // 進捗率の低い順にソート
                        .slice(0, 15) // 表示数を増加
                        .map((user) => {
                          const status = getProgressStatus(user.progressRate)
                          const rowBgColor = getRowBackgroundColor(user.progressRate)
                          
                          return (
                            <tr key={user.id} className={`transition-colors ${rowBgColor}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.userId}</div>
                                  <div className="mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-1 mr-3">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all ${
                                          user.progressRate <= 10 ? 'bg-red-500' :
                                          user.progressRate <= 20 ? 'bg-orange-500' :
                                          user.progressRate <= 30 ? 'bg-yellow-500' :
                                          user.progressRate < 70 ? 'bg-blue-500' :
                                          'bg-green-500'
                                        }`}
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
                                {user.progressRate <= 20 && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center text-xs text-red-600">
                                      ⚠️ 督促対象
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatTime(user.totalWatchedSeconds)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/admin/users/${user.id}`}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    詳細
                                  </Link>
                                  {user.progressRate <= 20 && (
                                    <Link
                                      href="/admin/notifications"
                                      className="text-red-600 hover:text-red-900 text-xs"
                                    >
                                      督促
                                    </Link>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
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