'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { courseAPI, Course } from '@/lib/api'

interface CourseForm {
  title: string
  description: string
  thumbnailFile?: FileList
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CourseForm>()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await courseAPI.getAll()
      
      // APIレスポンス構造を処理
      const coursesData = response.data?.data || response.data
      
      if (Array.isArray(coursesData)) {
        setCourses(coursesData)
      } else {
        setCourses([])
      }
    } catch (error: any) {
      setError(error.response?.data?.error || error.message || 'コースの取得に失敗しました')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CourseForm) => {
    try {
      setError('') // エラーをクリア
      setSuccess('') // 成功メッセージもクリア
      let thumbnailUrl = editingCourse?.thumbnailUrl

      // フォーム送信開始

      // サムネイル画像のアップロード（selectedFileステートから取得）
      if (selectedFile) {
        const file = selectedFile
        
        // 事前チェック
        if (file.size > 5 * 1024 * 1024) {
          setError('ファイルサイズは5MB以下にしてください')
          return
        }
        
        const formData = new FormData()
        formData.append('thumbnail', file)
        
        try {
          const uploadResponse = await courseAPI.uploadThumbnail(formData)
          
          if (uploadResponse.data?.data?.thumbnailUrl) {
            thumbnailUrl = uploadResponse.data.data.thumbnailUrl
          } else if (uploadResponse.data?.thumbnailUrl) {
            thumbnailUrl = uploadResponse.data.thumbnailUrl
          } else {
            setError('アップロードレスポンスにサムネイルURLが含まれていません')
            return
          }
        } catch (uploadError: any) {
          setError(`画像アップロードエラー: ${uploadError.response?.data?.error || uploadError.message}`)
          return
        }
      }

      const courseData = {
        title: data.title,
        description: data.description,
        thumbnailUrl
      }

      // コース保存開始

      if (editingCourse) {
        await courseAPI.update(editingCourse.id, courseData)
      } else {
        await courseAPI.create(courseData)
      }
      
      // 保存成功
      
      setSuccess(`コースが正常に保存されました${thumbnailUrl ? ' (サムネイル含む)' : ''}`)
      setTimeout(() => setSuccess(''), 5000) // 5秒後にメッセージを消去
      
      // フォームをクリア
      reset()
      setShowForm(false)
      setEditingCourse(null)
      setSelectedFile(null)
      
      // コース一覧を再取得
      await fetchCourses()
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'コースの保存に失敗しました'
      setError(errorMessage)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setValue('title', course.title)
    setValue('description', course.description || '')
    setSelectedFile(null)
    setShowForm(true)
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`「${course.title}」を削除しますか？`)) return

    try {
      await courseAPI.delete(course.id)
      fetchCourses()
    } catch (error: any) {
      setError(error.response?.data?.error || 'コースの削除に失敗しました')
    }
  }

  const handleCancel = () => {
    reset()
    setShowForm(false)
    setEditingCourse(null)
  }

  return (
    <AdminPageWrapper 
      title="コース管理" 
      description="研修コースの作成、編集、削除を行います"
    >

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">コース管理</h1>
              <p className="mt-2 text-gray-600">コース・カリキュラム・動画を管理できます</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchCourses()}
                className="btn-secondary"
                disabled={loading}
              >
                {loading ? '読み込み中...' : '🔄 更新'}
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                新規コース追加
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* コース作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingCourse ? 'コース編集' : '新規コース作成'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">コース名</label>
                  <input
                    {...register('title', { required: 'コース名は必須です' })}
                    className="form-input"
                    placeholder="コース名を入力"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">説明</label>
                  <textarea
                    {...register('description')}
                    className="form-input"
                    rows={3}
                    placeholder="コースの説明を入力"
                  />
                </div>

                <div>
                  <label className="form-label">サムネイル画像</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      id="thumbnail-file-input"
                      onChange={(e) => {
                        // 軽量化：最小限の処理のみ
                        const file = e.target.files?.[0]
                        if (file) {
                          // 基本チェックのみ（重い処理は送信時に）
                          if (file.size > 10 * 1024 * 1024) { // 10MB以上は即座に拒否
                            setError('ファイルサイズが大きすぎます')
                            e.target.value = ''
                            return
                          }
                          setSelectedFile(file)
                          setError('')
                        } else {
                          setSelectedFile(null)
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        // 軽量化：直接参照でクリック
                        const input = document.getElementById('thumbnail-file-input') as HTMLInputElement
                        if (input) {
                          input.click()
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {selectedFile ? '画像を変更' : '画像を選択'}
                    </button>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, GIF, WebP形式（最大5MB）
                    </p>
                  </div>
                  
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            サイズ: {selectedFile.size ? Math.round(selectedFile.size / 1024) : 0}KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null)
                            const input = document.getElementById('thumbnail-file-input') as HTMLInputElement
                            if (input) input.value = ''
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {editingCourse?.thumbnailUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">現在の画像:</p>
                      <img
                        src={editingCourse.thumbnailUrl}
                        alt="現在のサムネイル"
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isSubmitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* コース一覧 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="card">
                <div className="flex flex-col h-full">
                  {course.thumbnailUrl && (
                    <div className="mb-3">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-40 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
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
                      <span>{course.curriculums?.length || 0} カリキュラム</span>
                      <span>
                        {course.curriculums?.reduce((sum, curr) => sum + (curr.videos?.length || 0), 0) || 0} 動画
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="btn-primary text-sm flex-1 text-center"
                      >
                        詳細管理
                      </Link>
                      <button
                        onClick={() => handleEdit(course)}
                        className="btn-secondary text-sm px-3"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        className="btn-danger text-sm px-3"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">コースがまだ作成されていません</p>
          </div>
        )}
    </AdminPageWrapper>
  )
}