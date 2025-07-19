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

export default function AdminUsersPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'watchTime'>('progress')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

  const filteredAndSortedUsers = stats?.userStats
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: number, bValue: number
      
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        case 'progress':
          aValue = a.progressRate
          bValue = b.progressRate
          break
        case 'watchTime':
          aValue = a.totalWatchedSeconds
          bValue = b.totalWatchedSeconds
          break
        default:
          return 0
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }) || []

  const handleSort = (newSortBy: 'name' | 'progress' | 'watchTime') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm">
            ← 管理者ダッシュボードに戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">受講者管理</h1>
          <p className="mt-2 text-gray-600">受講者の進捗状況と詳細な視聴ログを確認できます</p>
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
            {/* 検索・フィルター */}
            <div className="card mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="受講者名またはメールアドレスで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="form-input"
                  >
                    <option value="progress">進捗率順</option>
                    <option value="name">名前順</option>
                    <option value="watchTime">視聴時間順</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="btn-secondary"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* 受講者一覧 */}
            <div className="card">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  受講者一覧 ({filteredAndSortedUsers.length}人)
                </h2>
              </div>

              {filteredAndSortedUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          受講者 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('progress')}
                        >
                          進捗率 {sortBy === 'progress' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          完了動画
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('watchTime')}
                        >
                          総視聴時間 {sortBy === 'watchTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedUsers.map((user) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                  <p className="text-gray-500">
                    {searchTerm ? '検索条件に一致する受講者が見つかりません' : '受講者データがありません'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </AuthGuard>
  )
}