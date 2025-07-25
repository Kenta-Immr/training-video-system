'use client'

// 動的レンダリングを強制（ユーザー認証・進捗情報のため）
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        console.log('Courses API response:', response.data)
        // API response format: {success: true, data: [...]}
        const coursesData = response.data?.data || response.data
        console.log('Courses data type:', typeof coursesData, 'Is array:', Array.isArray(coursesData))
        if (Array.isArray(coursesData)) {
          setCourses(coursesData)
        } else if (coursesData && typeof coursesData === 'object' && coursesData.data) {
          // ネストされたdata構造の場合
          setCourses(Array.isArray(coursesData.data) ? coursesData.data : [])
        } else {
          console.warn('Unexpected courses data format:', coursesData)
          throw new Error('Invalid courses data format')
        }
      } catch (error: any) {
        console.warn('API からのコース取得に失敗したため、デモデータを使用します:', error)
        // APIが利用できない場合はデモコースを表示
        const demoCoursesModule = await import('@/lib/api')
        if (demoCoursesModule.default) {
          // デモコースがあれば設定（api.tsから取得）
          setCourses([
            {
              id: 1,
              title: "ウェブ開発入門",
              description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
              thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
              curriculums: [
                {
                  id: 1,
                  title: "HTML基礎",
                  description: "HTMLの基本構文と要素",
                  courseId: 1,
                  videos: [
                    { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
                    { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 }
                  ]
                }
              ]
            },
            {
              id: 2,
              title: "データベース設計",
              description: "SQL、NoSQLの基礎とデータベース設計の実践的な学習",
              thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
              curriculums: [
                {
                  id: 2,
                  title: "SQL基礎",
                  description: "SQLの基本構文",
                  courseId: 2,
                  videos: [
                    { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
                    { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 }
                  ]
                }
              ]
            }
          ])
        } else {
          setError('コースデータの取得に失敗しました')
        }
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">コース一覧</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">利用可能な研修コースから選択してください</p>
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                          className="w-full h-32 sm:h-40 object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    
                    {course.description && (
                      <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow line-clamp-3">
                        {course.description}
                      </p>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span>📚 {course.curriculums.length} カリキュラム</span>
                        <span>🎥 {totalVideos} 動画</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                          <span>進捗</span>
                          <span className="font-medium">{progress}%</span>
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