'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { courseAPI, logAPI, Course, Video } from '@/lib/api'

interface VideoWithStats extends Video {
  totalViews: number
  completionRate: number
  averageWatchTime: number
  recentViews: number
}

export default function AdminVideosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [videoStats, setVideoStats] = useState<VideoWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'views' | 'completion' | 'recent'>('views')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [coursesResponse] = await Promise.all([
        courseAPI.getAll()
      ])
      
      setCourses(coursesResponse.data)
      
      // 全動画の統計を計算
      const allVideos: VideoWithStats[] = []
      
      for (const course of coursesResponse.data) {
        for (const curriculum of course.curriculums || []) {
          for (const video of curriculum.videos || []) {
            try {
              const logsResponse = await logAPI.getVideoLogs(video.id)
              const logs = logsResponse.data
              
              const totalViews = logs.length
              const completedViews = logs.filter(log => log.isCompleted).length
              const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0
              const averageWatchTime = totalViews > 0 
                ? logs.reduce((sum, log) => sum + log.watchedSeconds, 0) / totalViews 
                : 0
              
              // 過去7日間のビュー数
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              const recentViews = logs.filter(log => 
                new Date(log.lastWatchedAt) > weekAgo
              ).length

              allVideos.push({
                ...video,
                totalViews,
                completionRate,
                averageWatchTime,
                recentViews
              })
            } catch (error) {
              console.error(`Error fetching logs for video ${video.id}:`, error)
              allVideos.push({
                ...video,
                totalViews: 0,
                completionRate: 0,
                averageWatchTime: 0,
                recentViews: 0
              })
            }
          }
        }
      }
      
      setVideoStats(allVideos)
    } catch (error: any) {
      setError(error.response?.data?.error || 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${mins}分`
    }
    return `${mins}分`
  }

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    if (rate >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const filteredAndSortedVideos = videoStats
    .filter(video => {
      if (selectedCourse === 'all') return true
      return courses.find(course => 
        course.curriculums?.some(curriculum => 
          curriculum.videos?.some(v => v.id === video.id)
        ) && course.id.toString() === selectedCourse
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.totalViews - a.totalViews
        case 'completion':
          return b.completionRate - a.completionRate
        case 'recent':
          return b.recentViews - a.recentViews
        default:
          return 0
      }
    })

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
          <h1 className="text-3xl font-bold text-gray-900">動画視聴状況</h1>
          <p className="mt-2 text-gray-600">各動画の視聴統計と分析データを確認できます</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* フィルターとソート */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="form-label">コースでフィルター</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="form-input"
              >
                <option value="all">すべてのコース</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id.toString()}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="form-label">並び順</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="form-input"
              >
                <option value="views">総視聴数順</option>
                <option value="completion">完了率順</option>
                <option value="recent">最近の視聴数順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredAndSortedVideos.length}
            </div>
            <div className="text-gray-600">総動画数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredAndSortedVideos.reduce((sum, video) => sum + video.totalViews, 0)}
            </div>
            <div className="text-gray-600">総視聴数</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredAndSortedVideos.length > 0 
                ? Math.round(filteredAndSortedVideos.reduce((sum, video) => sum + video.completionRate, 0) / filteredAndSortedVideos.length)
                : 0}%
            </div>
            <div className="text-gray-600">平均完了率</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredAndSortedVideos.reduce((sum, video) => sum + video.recentViews, 0)}
            </div>
            <div className="text-gray-600">今週の視聴数</div>
          </div>
        </div>

        {/* 動画一覧 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      動画情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総視聴数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      完了率
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均視聴時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      今週の視聴
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedVideos.map((video) => {
                    const course = courses.find(c => 
                      c.curriculums?.some(curr => 
                        curr.videos?.some(v => v.id === video.id)
                      )
                    )
                    const curriculum = course?.curriculums?.find(curr => 
                      curr.videos?.some(v => v.id === video.id)
                    )

                    return (
                      <tr key={video.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {video.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {course?.title} > {curriculum?.title}
                            </div>
                            {video.description && (
                              <div className="text-xs text-gray-400 mt-1">
                                {video.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="text-lg font-semibold">{video.totalViews}</span>
                            <span className="ml-1 text-gray-500">回</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${video.completionRate}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className={`font-medium ${getCompletionColor(video.completionRate)}`}>
                              {Math.round(video.completionRate)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(video.averageWatchTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {video.recentViews}回
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/admin/videos/${video.id}`}
                            className="text-blue-600 hover:text-blue-900"
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
            
            {filteredAndSortedVideos.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">条件に一致する動画がありません</p>
              </div>
            )}
          </div>
        )}
      </main>
    </AuthGuard>
  )
}