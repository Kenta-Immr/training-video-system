'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AuthGuard from '@/components/AuthGuard'
import { groupAPI, GroupProgress } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

export default function GroupProgressPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = parseInt(params.id as string)
  
  const [progressData, setProgressData] = useState<GroupProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'completionRate' | 'lastLogin'>('completionRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'firstLogin' | 'completed' | 'behind'>('all')

  // 管理者チェック
  if (!isAdmin()) {
    router.push('/')
    return null
  }

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await groupAPI.getProgress(groupId)
        setProgressData(response.data)
      } catch (error: any) {
        setError(error.response?.data?.error || 'グループ進捗の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [groupId])

  const filteredAndSortedMembers = progressData?.members
    .filter((member) => {
      switch (filterStatus) {
        case 'active':
          return !member.user.isFirstLogin
        case 'firstLogin':
          return member.user.isFirstLogin
        case 'completed':
          return member.progress.completionRate >= 80
        case 'behind':
          return member.progress.completionRate < 30
        default:
          return true
      }
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.user.name
          bValue = b.user.name
          break
        case 'completionRate':
          aValue = a.progress.completionRate
          bValue = b.progress.completionRate
          break
        case 'lastLogin':
          aValue = a.user.lastLoginAt ? new Date(a.user.lastLoginAt).getTime() : 0
          bValue = b.user.lastLoginAt ? new Date(b.user.lastLoginAt).getTime() : 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: 'name' | 'completionRate' | 'lastLogin') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
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

  if (error) {
    return (
      <AuthGuard requireAdmin>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                {progressData?.group.name} - 進捗管理
              </h1>
              <p className="mt-2 text-gray-600">
                グループコード: {progressData?.group.code}
              </p>
            </div>
            <Link
              href="/admin/groups"
              className="btn-secondary"
            >
              グループ管理に戻る
            </Link>
          </div>
        </div>

        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">👥</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">総メンバー数</h3>
                <p className="text-3xl font-bold text-gray-900">{progressData?.members.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📚</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">対象コース数</h3>
                <p className="text-3xl font-bold text-gray-900">{progressData?.courses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🔴</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">初回ログイン未完了</h3>
                <p className="text-3xl font-bold text-red-600">
                  {progressData?.members.filter(m => m.user.isFirstLogin).length}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {progressData?.members.length ? 
                    Math.round((progressData.members.filter(m => m.user.isFirstLogin).length / progressData.members.length) * 100)
                    : 0}% がアクティブ待ち
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">平均完了率</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {progressData?.members.length ? 
                    Math.round(progressData.members.reduce((sum, m) => sum + m.progress.completionRate, 0) / progressData.members.length) 
                    : 0}%
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  グループ全体の平均進捗
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 追加統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-sm font-medium text-green-700 mb-2">🎯 完了率80%以上のメンバー</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-800">
                {progressData?.members.filter(m => m.progress.completionRate >= 80).length || 0}
              </p>
              <p className="text-sm text-green-600">
                /{progressData?.members.length || 0}人
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-700 mb-2">⚠️ 進捗が遅れているメンバー</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-yellow-800">
                {progressData?.members.filter(m => m.progress.completionRate < 30).length || 0}
              </p>
              <p className="text-sm text-yellow-600">
                完了率30%未満
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 mb-2">🎥 総視聴動画数</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-blue-800">
                {progressData?.members.reduce((sum, m) => sum + m.progress.watchedVideos, 0) || 0}
              </p>
              <p className="text-sm text-blue-600">
                グループ全体
              </p>
            </div>
          </div>
        </div>

        {/* メンバー進捗テーブル */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                メンバー進捗一覧 
                <span className="text-sm text-gray-500 font-normal ml-2">
                  ({filteredAndSortedMembers?.length || 0}/{progressData?.members.length || 0}人表示)
                </span>
              </h2>
              <div className="flex items-center space-x-4">
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="form-input text-sm"
                >
                  <option value="all">全員表示</option>
                  <option value="active">アクティブユーザー</option>
                  <option value="firstLogin">初回ログイン待ち</option>
                  <option value="completed">完了率80%以上</option>
                  <option value="behind">進捗遅れ（30%未満）</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    ユーザー名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('completionRate')}
                  >
                    完了率 {sortBy === 'completionRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    視聴状況
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLogin')}
                  >
                    最終ログイン {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedMembers?.map((member) => (
                  <tr key={member.user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.user.isFirstLogin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {member.user.isFirstLogin ? '初回ログイン未完了' : 'アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(member.progress.completionRate)}`}
                            style={{ width: `${member.progress.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {member.progress.completionRate}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {member.progress.completedVideos}/{member.progress.totalVideos} 完了
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.progress.watchedVideos}/{member.progress.totalVideos} 視聴
                      <div className="text-xs text-gray-500">
                        視聴率: {member.progress.watchRate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(member.user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/users/${member.user.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 対象コース一覧 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">対象コース</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressData?.courses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}