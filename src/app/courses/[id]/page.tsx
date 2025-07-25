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
        console.log('Course API response:', response)
        
        // APIレスポンスの構造をチェック
        let courseData = response.data
        if (response.data?.data) {
          courseData = response.data.data
        }
        
        // curriculumsが存在しない場合は空配列で初期化
        if (courseData && !courseData.curriculums) {
          courseData.curriculums = []
        }
        
        console.log('Course data after processing:', courseData)
        setCourse(courseData)
      } catch (error: any) {
        console.error('Course fetch error:', error)
        setError(error.response?.data?.message || error.response?.data?.error || 'コースの取得に失敗しました')
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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="hidden sm:inline">視聴完了</span>
            <span className="sm:hidden">完了</span>
          </span>
        )
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="hidden sm:inline">視聴中</span>
            <span className="sm:hidden">進行中</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="hidden sm:inline">未視聴</span>
            <span className="sm:hidden">未開始</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            コース一覧に戻る
          </Link>
        </div>

        <div className="mb-6 sm:mb-8">
          {course.thumbnailUrl && (
            <div className="mb-4 sm:mb-6">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full max-w-md h-40 sm:h-48 object-cover rounded-lg"
              />
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{course.title}</h1>
          {course.description && (
            <p className="mt-2 text-sm sm:text-base text-gray-600">{course.description}</p>
          )}
        </div>

        <div className="space-y-6 sm:space-y-8">
          {course.curriculums?.map((curriculum) => (
            <div key={curriculum.id} className="card">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                {curriculum.title}
              </h2>
              
              {curriculum.description && (
                <p className="text-sm sm:text-base text-gray-600 mb-4">{curriculum.description}</p>
              )}

              <div className="space-y-3">
                {curriculum.videos.map((video) => {
                  const status = getVideoStatus(video)
                  
                  return (
                    <Link
                      key={video.id}
                      href={`/videos/${video.id}`}
                      className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{video.title}</h3>
                          {video.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                        <div className="ml-3 flex items-center space-x-2 flex-shrink-0">
                          {getStatusBadge(status)}
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {curriculum.videos.length === 0 && (
                  <p className="text-gray-500 text-xs sm:text-sm italic">動画がまだ登録されていません</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!course.curriculums || course.curriculums.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">カリキュラムがまだ登録されていません</p>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}