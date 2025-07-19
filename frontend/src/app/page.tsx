'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { courseAPI, Course } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getAll()
        setCourses(response.data)
      } catch (error: any) {
        setError(error.response?.data?.error || 'コースの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const calculateProgress = (course: Course) => {
    const user = getCurrentUser()
    if (!user) return 0

    const allVideos = course.curriculums.flatMap(curriculum => curriculum.videos)
    const completedVideos = allVideos.filter(video => 
      video.viewingLogs?.some(log => log.userId === user.id && log.isCompleted)
    )

    return allVideos.length > 0 ? Math.round((completedVideos.length / allVideos.length) * 100) : 0
  }

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">コース一覧</h1>
          <p className="mt-2 text-gray-600">利用可能な研修コースから選択してください</p>
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

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const progress = calculateProgress(course)
              const totalVideos = course.curriculums.reduce(
                (sum, curriculum) => sum + curriculum.videos.length,
                0
              )

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex flex-col h-full">
                    {course.thumbnailUrl && (
                      <div className="mb-3">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-40 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    
                    {course.description && (
                      <p className="text-gray-600 mb-4 flex-grow">
                        {course.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{course.curriculums.length} カリキュラム</span>
                        <span>{totalVideos} 動画</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>進捗</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">利用可能なコースがありません</p>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}