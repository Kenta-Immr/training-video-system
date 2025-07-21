'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { courseAPI, videoAPI, Course, Curriculum, Video } from '@/lib/api'

interface CurriculumForm {
  title: string
  description: string
}

interface VideoForm {
  title: string
  description: string
  videoUrl: string
  videoFile?: FileList
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = parseInt(params.id as string)
  
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCurriculumForm, setShowCurriculumForm] = useState(false)
  const [showVideoForm, setShowVideoForm] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null)

  const curriculumForm = useForm<CurriculumForm>()
  const videoForm = useForm<VideoForm>()

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await courseAPI.getById(courseId)
      // APIレスポンス構造をチェック
      const courseData = response.data.data || response.data
      setCourse(courseData)
    } catch (error: any) {
      setError(error.response?.data?.error || 'コースの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitCurriculum = async (data: CurriculumForm) => {
    try {
      if (editingCurriculum) {
        await courseAPI.updateCurriculum(editingCurriculum.id, data)
      } else {
        await courseAPI.createCurriculum(courseId, data)
      }
      
      curriculumForm.reset()
      setShowCurriculumForm(false)
      setEditingCurriculum(null)
      fetchCourse()
    } catch (error: any) {
      setError(error.response?.data?.error || 'カリキュラムの保存に失敗しました')
    }
  }

  const onSubmitVideo = async (data: VideoForm) => {
    try {
      console.log('=== 動画追加開始 ===')
      console.log('フォームデータ:', data)
      console.log('選択されたカリキュラムID:', selectedCurriculumId)
      
      if (!selectedCurriculumId) {
        setError('カリキュラムが選択されていません')
        return
      }

      // ファイルアップロードがある場合
      if (data.videoFile && data.videoFile.length > 0) {
        console.log('ファイルアップロードモード')
        const formData = new FormData()
        formData.append('video', data.videoFile[0])
        formData.append('title', data.title)
        formData.append('description', data.description || '')
        formData.append('curriculumId', selectedCurriculumId.toString())

        if (editingVideo) {
          console.log('既存動画の更新')
          await videoAPI.update(editingVideo.id, {
            title: data.title,
            description: data.description,
            videoUrl: data.videoUrl || editingVideo.videoUrl
          })
        } else {
          console.log('新規動画のアップロード')
          await videoAPI.upload(formData)
        }
      } else {
        console.log('URLモード')
        // URLでの動画追加・更新
        const videoData = {
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl || '',
          curriculumId: selectedCurriculumId
        }
        console.log('動画データ:', videoData)

        if (editingVideo) {
          console.log('既存動画の更新 (URL)')
          await videoAPI.update(editingVideo.id, videoData)
        } else {
          console.log('新規動画の作成 (URL)')
          await videoAPI.create(videoData)
        }
      }
      
      console.log('動画保存成功 - フォームをリセット中')
      videoForm.reset()
      setShowVideoForm(false)
      setEditingVideo(null)
      setSelectedCurriculumId(null)
      console.log('コース情報を再取得中')
      await fetchCourse()
      console.log('=== 動画追加完了 ===')
    } catch (error: any) {
      console.error('動画保存エラー:', error)
      console.error('エラーレスポンス:', error.response?.data)
      setError(error.response?.data?.message || error.response?.data?.error || error.message || '動画の保存に失敗しました')
    }
  }

  const handleDeleteVideo = async (video: Video) => {
    if (!confirm(`「${video.title}」を削除しますか？`)) return

    try {
      await videoAPI.delete(video.id)
      fetchCourse()
    } catch (error: any) {
      setError(error.response?.data?.error || '動画の削除に失敗しました')
    }
  }

  const handleAddVideo = (curriculumId: number) => {
    setSelectedCurriculumId(curriculumId)
    setShowVideoForm(true)
  }

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video)
    setSelectedCurriculumId(video.curriculumId)
    videoForm.setValue('title', video.title)
    videoForm.setValue('description', video.description || '')
    videoForm.setValue('videoUrl', video.videoUrl)
    setShowVideoForm(true)
  }

  const handleEditCurriculum = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    curriculumForm.setValue('title', curriculum.title)
    curriculumForm.setValue('description', curriculum.description || '')
    setShowCurriculumForm(true)
  }

  const handleDeleteCurriculum = async (curriculum: Curriculum) => {
    if (!confirm(`「${curriculum.title}」を削除しますか？関連する動画も削除されます。`)) return

    try {
      await courseAPI.deleteCurriculum(curriculum.id)
      fetchCourse()
    } catch (error: any) {
      setError(error.response?.data?.error || 'カリキュラムの削除に失敗しました')
    }
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

  if (error || !course) {
    return (
      <AuthGuard requireAdmin>
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
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin/courses" className="text-blue-600 hover:text-blue-800 text-sm">
            ← コース管理に戻る
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              {course.description && (
                <p className="mt-2 text-gray-600">{course.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowCurriculumForm(true)}
              className="btn-primary"
            >
              カリキュラム追加
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* カリキュラム作成・編集フォーム */}
        {showCurriculumForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingCurriculum ? 'カリキュラム編集' : '新規カリキュラム作成'}
              </h2>
              
              <form onSubmit={curriculumForm.handleSubmit(onSubmitCurriculum)} className="space-y-4">
                <div>
                  <label className="form-label">カリキュラム名</label>
                  <input
                    {...curriculumForm.register('title', { required: 'カリキュラム名は必須です' })}
                    className="form-input"
                    placeholder="カリキュラム名を入力"
                  />
                  {curriculumForm.formState.errors.title && (
                    <p className="mt-1 text-sm text-red-600">{curriculumForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">説明</label>
                  <textarea
                    {...curriculumForm.register('description')}
                    className="form-input"
                    rows={3}
                    placeholder="カリキュラムの説明を入力"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={curriculumForm.formState.isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {curriculumForm.formState.isSubmitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      curriculumForm.reset()
                      setShowCurriculumForm(false)
                      setEditingCurriculum(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 動画作成フォーム */}
        {showVideoForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingVideo ? '動画編集' : '新規動画追加'}
              </h2>
              
              <form onSubmit={videoForm.handleSubmit(onSubmitVideo)} className="space-y-4">
                <div>
                  <label className="form-label">動画タイトル</label>
                  <input
                    {...videoForm.register('title', { required: '動画タイトルは必須です' })}
                    className="form-input"
                    placeholder="動画タイトルを入力"
                  />
                  {videoForm.formState.errors.title && (
                    <p className="mt-1 text-sm text-red-600">{videoForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">説明</label>
                  <textarea
                    {...videoForm.register('description')}
                    className="form-input"
                    rows={3}
                    placeholder="動画の説明を入力"
                  />
                </div>

                <div>
                  <label className="form-label">動画URL</label>
                  <input
                    {...videoForm.register('videoUrl')}
                    className="form-input"
                    placeholder="https://example.com/video.mp4"
                  />
                </div>

                <div>
                  <label className="form-label">または動画ファイル</label>
                  <input
                    {...videoForm.register('videoFile')}
                    type="file"
                    accept="video/*"
                    className="form-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    MP4, WebM, OGG形式がサポートされています
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={videoForm.formState.isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {videoForm.formState.isSubmitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      videoForm.reset()
                      setShowVideoForm(false)
                      setEditingVideo(null)
                      setSelectedCurriculumId(null)
                    }}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* カリキュラム一覧 */}
        <div className="space-y-8">
          {course.curriculums?.map((curriculum) => (
            <div key={curriculum.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {curriculum.title}
                  </h2>
                  {curriculum.description && (
                    <p className="text-gray-600 mt-1">{curriculum.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddVideo(curriculum.id)}
                    className="btn-primary text-sm"
                  >
                    動画追加
                  </button>
                  <button
                    onClick={() => handleEditCurriculum(curriculum)}
                    className="btn-secondary text-sm"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDeleteCurriculum(curriculum)}
                    className="btn-danger text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {curriculum.videos?.map((video) => (
                  <div
                    key={video.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">URL: {video.videoUrl}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditVideo(video)}
                          className="btn-secondary text-sm px-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video)}
                          className="btn-danger text-sm px-3"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                )) || []}

                {(!curriculum.videos || curriculum.videos.length === 0) && (
                  <p className="text-gray-500 text-sm italic">動画がまだ登録されていません</p>
                )}
              </div>
            </div>
          )) || []}
        </div>

        {(!course.curriculums || course.curriculums.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">カリキュラムがまだ作成されていません</p>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}