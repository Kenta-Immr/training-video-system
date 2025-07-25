'use client'

// コース管理は動的コンテンツ（動画アップロード等）
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState, useRef } from 'react'
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
  const isMountedRef = useRef<boolean>(true)
  
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
    
    return () => {
      isMountedRef.current = false
    }
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await courseAPI.getById(courseId)
      // APIレスポンス構造をチェック
      const courseData = response.data.data || response.data
      
      if (isMountedRef.current) {
        setCourse(courseData)
      }
    } catch (error: any) {
      if (isMountedRef.current) {
        setError(error.response?.data?.error || 'コースの取得に失敗しました')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
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
        const file = data.videoFile[0]
        const fileSize = file.size
        const maxChunkSize = 10 * 1024 * 1024 // 10MB chunks
        
        if (editingVideo) {
          console.log('既存動画の更新')
          await videoAPI.update(editingVideo.id, {
            title: data.title,
            description: data.description,
            videoUrl: data.videoUrl || editingVideo.videoUrl
          })
        } else {
          console.log(`新規動画のアップロード (ファイルサイズ: ${(fileSize / 1024 / 1024).toFixed(2)}MB)`)
          const token = localStorage.getItem('token')
          console.log('使用するトークン:', token)
          
          // ファイルサイズに応じてアップロード方法を選択
          if (fileSize <= 50 * 1024 * 1024) { // 50MB以下は通常アップロード
            console.log('通常アップロード使用')
            const formData = new FormData()
            formData.append('video', file)
            
            const response = await fetch('/api/videos/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Video-Title': data.title,
                'X-Video-Description': data.description || '',
                'X-Curriculum-Id': selectedCurriculumId.toString()
              },
              body: formData
            })
            
            console.log('レスポンスステータス:', response.status)
            
            if (!response.ok) {
              const errorText = await response.text()
              console.error('アップロードエラー詳細:', errorText)
              throw new Error(`アップロードエラー: ${response.status} - ${errorText}`)
            }
            
            const result = await response.json()
            console.log('アップロード結果:', result)
            
            if (!result.success) {
              throw new Error(result.message || 'アップロードに失敗しました')
            }
          } else {
            // 50MB超の場合はチャンクアップロード
            console.log('チャンクアップロード使用')
            const totalChunks = Math.ceil(fileSize / maxChunkSize)
            console.log(`${totalChunks}個のチャンクに分割してアップロード`)
            
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              const start = chunkIndex * maxChunkSize
              const end = Math.min(start + maxChunkSize, fileSize)
              const chunk = file.slice(start, end)
              
              console.log(`チャンク ${chunkIndex + 1}/${totalChunks} をアップロード中...`)
              
              const formData = new FormData()
              formData.append('chunk', chunk)
              
              const response = await fetch('/api/videos/chunked-upload', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'X-Chunk-Index': chunkIndex.toString(),
                  'X-Total-Chunks': totalChunks.toString(),
                  'X-Video-Title': data.title,
                  'X-Video-Description': data.description || '',
                  'X-Curriculum-Id': selectedCurriculumId.toString()
                },
                body: formData
              })
              
              if (!response.ok) {
                const errorText = await response.text()
                console.error(`チャンク ${chunkIndex + 1} アップロードエラー:`, errorText)
                throw new Error(`チャンクアップロードエラー: ${response.status} - ${errorText}`)
              }
              
              const result = await response.json()
              console.log(`チャンク ${chunkIndex + 1} 結果:`, result)
              
              if (!result.success) {
                throw new Error(result.message || `チャンク ${chunkIndex + 1} のアップロードに失敗しました`)
              }
            }
            
            console.log('全チャンクのアップロード完了')
          }
        }
      } else {
        console.log('URLモード')
        
        // URLが入力されているかチェック
        if (!data.videoUrl || data.videoUrl.trim() === '') {
          setError('動画URLまたはファイルのどちらかを入力してください')
          return
        }
        
        // URLでの動画追加・更新
        const videoData = {
          title: data.title,
          description: data.description,
          videoUrl: data.videoUrl.trim(),
          curriculumId: selectedCurriculumId
        }
        console.log('動画データ:', videoData)

        if (editingVideo) {
          console.log('既存動画の更新 (URL)')
          await videoAPI.update(editingVideo.id, videoData)
        } else {
          console.log('新規動画の確実作成 (URL)')
          // 確実動画作成エンドポイント使用
          const token = localStorage.getItem('token')
          const response = await fetch('/api/create-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(videoData)
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const result = await response.json()
          console.log('確実動画作成完了:', result)
          
          if (!result.success) {
            throw new Error(result.message || '動画作成に失敗しました')
          }
        }
      }
      
      console.log('動画保存成功 - フォームをリセット中')
      
      if (isMountedRef.current) {
        videoForm.reset()
        setShowVideoForm(false)
        setEditingVideo(null)
        setSelectedCurriculumId(null)
        console.log('コース情報を再取得中')
        await fetchCourse()
        console.log('=== 動画追加完了 ===')
      }
    } catch (error: any) {
      console.error('動画保存エラー:', error)
      console.error('エラーレスポンス:', error.response?.data)
      
      if (isMountedRef.current) {
        setError(error.response?.data?.message || error.response?.data?.error || error.message || '動画の保存に失敗しました')
      }
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
                    {...videoForm.register('videoUrl', {
                      validate: (value, formValues) => {
                        const hasFile = formValues.videoFile && formValues.videoFile.length > 0
                        const hasUrl = value && value.trim() !== ''
                        
                        if (!hasFile && !hasUrl && !editingVideo) {
                          return '動画URLまたはファイルのどちらかを入力してください'
                        }
                        return true
                      }
                    })}
                    className="form-input"
                    placeholder="https://example.com/video.mp4 または YouTube URL"
                  />
                  {videoForm.formState.errors.videoUrl && (
                    <p className="mt-1 text-sm text-red-600">{videoForm.formState.errors.videoUrl.message}</p>
                  )}
                </div>

                <div className="text-center text-sm text-gray-500 py-2">
                  ── または ──
                </div>

                <div>
                  <label className="form-label">動画ファイル</label>
                  <input
                    {...videoForm.register('videoFile', {
                      validate: (value, formValues) => {
                        const hasFile = value && value.length > 0
                        const hasUrl = formValues.videoUrl && formValues.videoUrl.trim() !== ''
                        
                        if (!hasFile && !hasUrl && !editingVideo) {
                          return '動画ファイルまたはURLのどちらかを入力してください'
                        }
                        
                        // ファイルサイズチェック（50MB = 52,428,800 bytes）
                        if (hasFile && value[0] && value[0].size > 52428800) {
                          return 'ファイルサイズが50MBを超えています'
                        }
                        
                        return true
                      }
                    })}
                    type="file"
                    accept="video/*"
                    className="form-input"
                  />
                  {videoForm.formState.errors.videoFile && (
                    <p className="mt-1 text-sm text-red-600">{videoForm.formState.errors.videoFile.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    MP4, WebM, OGG形式がサポートされています（最大50MB）
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