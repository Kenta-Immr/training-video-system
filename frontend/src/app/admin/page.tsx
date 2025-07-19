'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
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
        const response = await logAPI.getStats()
        setStats(response.data)
      } catch (error: any) {
        setError(error.response?.data?.error || '統計データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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

        {stats && (
          <>
            {/* 概要統計 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-gray-600">受講者数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalVideos}</div>
                <div className="text-gray-600">総動画数</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.userStats.length > 0 
                    ? Math.round(stats.userStats.reduce((sum, user) => sum + user.progressRate, 0) / stats.userStats.length)
                    : 0}%
                </div>
                <div className="text-gray-600">平均進捗率</div>
              </div>
            </div>

            {/* 管理メニュー */}
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">管理メニュー</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/admin/courses"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-blue-600 text-2xl mb-2">📚</div>
                  <div className="font-medium">コース管理</div>
                  <div className="text-sm text-gray-600">コース・カリキュラム・動画・ファイルアップロード</div>
                </Link>
                <Link
                  href="/admin/progress"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-green-600 text-2xl mb-2">📊</div>
                  <div className="font-medium">進捗管理</div>
                  <div className="text-sm text-gray-600">個人・グループ別進捗確認</div>
                </Link>
                <Link
                  href="/admin/users/manage"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-blue-600 text-2xl mb-2">👥</div>
                  <div className="font-medium">ユーザー管理</div>
                  <div className="text-sm text-gray-600">ユーザー追加・編集・削除</div>
                </Link>
                <Link
                  href="/admin/users/bulk-create"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-cyan-600 text-2xl mb-2">📝</div>
                  <div className="font-medium">一括ユーザー作成</div>
                  <div className="text-sm text-gray-600">CSV・手動入力でユーザー一括追加</div>
                </Link>
                <Link
                  href="/admin/videos"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-purple-600 text-2xl mb-2">🎥</div>
                  <div className="font-medium">動画ログ</div>
                  <div className="text-sm text-gray-600">動画別視聴状況</div>
                </Link>
                <Link
                  href="/admin/reports"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-orange-600 text-2xl mb-2">📈</div>
                  <div className="font-medium">レポート</div>
                  <div className="text-sm text-gray-600">詳細分析・エクスポート</div>
                </Link>
                <Link
                  href="/admin/groups"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-indigo-600 text-2xl mb-2">👥</div>
                  <div className="font-medium">グループ管理</div>
                  <div className="text-sm text-gray-600">受講者のグループ分け</div>
                </Link>
                <Link
                  href="/admin/notifications"
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className="text-red-600 text-2xl mb-2">🔔</div>
                  <div className="font-medium">通知・アラート</div>
                  <div className="text-sm text-gray-600">初回ログイン未完了ユーザー管理</div>
                </Link>
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

              {stats.userStats.length > 0 ? (
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
                      {stats.userStats.slice(0, 10).map((user) => (
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