'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { courseAPI, Course } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = parseInt(params.id as string)
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getById(courseId)
        setCourse(response.data)
      } catch (error: any) {
        setError(error.response?.data?.error || 'コースの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      fetchCourse()
    }
  }, [courseId])

  const getVideoStatus = (video: any) => {
    const user = getCurrentUser()
    if (!user) return 'unwatched'

    const log = video.viewingLogs?.find((log: any) => log.userId === user.id)
    if (!log) return 'unwatched'
    if (log.isCompleted) return 'completed'
    if (log.watchedSeconds > 0) return 'in-progress'
    return 'unwatched'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            視聴完了
          </span>
        )
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            視聴中
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            未視聴
          </span>
        )
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </AuthGuard>
    )
  }

  if (error || !course) {
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error || 'コースが見つかりません'}</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
            ← コース一覧に戻る
          </Link>
        </div>

        <div className="mb-8">
          {course.thumbnailUrl && (
            <div className="mb-6">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full max-w-md h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-gray-600">{course.description}</p>
          )}
        </div>

        <div className="space-y-8">
          {course.curriculums.map((curriculum) => (
            <div key={curriculum.id} className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {curriculum.title}
              </h2>
              
              {curriculum.description && (
                <p className="text-gray-600 mb-4">{curriculum.description}</p>
              )}

              <div className="space-y-3">
                {curriculum.videos.map((video) => {
                  const status = getVideoStatus(video)
                  
                  return (
                    <Link
                      key={video.id}
                      href={`/videos/${video.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{video.title}</h3>
                          {video.description && (
                            <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                          )}
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          {getStatusBadge(status)}
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {curriculum.videos.length === 0 && (
                  <p className="text-gray-500 text-sm italic">動画がまだ登録されていません</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {course.curriculums.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">カリキュラムがまだ登録されていません</p>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}