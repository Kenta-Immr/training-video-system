'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactPlayer from 'react-player'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { videoAPI, logAPI, Video } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

export default function VideoPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = parseInt(params.id as string)
  
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const playerRef = useRef<ReactPlayer>(null)
  const lastSavedProgressRef = useRef(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await videoAPI.getById(videoId)
        setVideo(response.data)
        
        // 既存の視聴ログがあれば再生位置を復元
        const user = getCurrentUser()
        if (user && response.data.viewingLogs) {
          const userLog = response.data.viewingLogs.find(log => log.userId === user.id)
          if (userLog && userLog.watchedSeconds > 0) {
            setPlayed(userLog.watchedSeconds / (duration || 1))
          }
        }
      } catch (error: any) {
        setError(error.response?.data?.error || '動画の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (videoId) {
      fetchVideo()
    }
  }, [videoId, duration])

  // 定期的に視聴ログを保存（30秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      if (playing && video && duration > 0) {
        saveProgress()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [playing, video, duration, played])

  // ページ離脱時に最終的な視聴ログを保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (video && duration > 0) {
        saveProgress(true)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [video, duration, played])

  const saveProgress = async (isSync = false) => {
    if (!video || !duration) return

    const watchedSeconds = Math.floor(played * duration)
    
    // 前回保存した進捗と同じ場合はスキップ
    if (watchedSeconds === lastSavedProgressRef.current) return

    const isCompleted = played >= 0.9 // 90%以上視聴で完了とみなす

    try {
      if (isSync) {
        // 同期的に保存（ページ離脱時）
        await logAPI.saveLog({
          videoId: video.id,
          watchedSeconds,
          isCompleted
        })
      } else {
        // 非同期で保存（定期保存）
        logAPI.saveLog({
          videoId: video.id,
          watchedSeconds,
          isCompleted
        }).catch(console.error)
      }
      
      lastSavedProgressRef.current = watchedSeconds
    } catch (error) {
      console.error('視聴ログの保存に失敗しました:', error)
    }
  }

  const handlePlay = () => {
    setPlaying(true)
  }

  const handlePause = () => {
    setPlaying(false)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    // 一時停止時は少し遅延をもって保存
    saveTimeoutRef.current = setTimeout(() => saveProgress(), 2000)
  }

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.played)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds / duration)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  if (error || !video) {
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error || '動画が見つかりません'}</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  const user = getCurrentUser()
  const userLog = user && video.viewingLogs?.find(log => log.userId === user.id)
  const watchedPercentage = duration > 0 ? Math.round((played * 100)) : 0

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 戻る
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 動画プレイヤー */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <ReactPlayer
                ref={playerRef}
                url={video.videoUrl}
                width="100%"
                height="100%"
                playing={playing}
                onPlay={handlePlay}
                onPause={handlePause}
                onProgress={handleProgress}
                onDuration={handleDuration}
                controls
                progressInterval={1000}
              />
            </div>

            {/* 進捗バー */}
            <div className="mt-4 p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">視聴進捗</span>
                <span className="text-sm text-gray-600">{watchedPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${watchedPercentage}%` }}
                ></div>
              </div>
              {duration > 0 && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatTime(played * duration)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 動画情報サイドバー */}
          <div className="space-y-6">
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>
              
              {video.description && (
                <p className="text-gray-600 mb-4">{video.description}</p>
              )}

              {video.curriculum && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>コース:</strong> {video.curriculum.course?.title}</p>
                  <p><strong>カリキュラム:</strong> {video.curriculum.title}</p>
                </div>
              )}
            </div>

            {/* 視聴統計 */}
            {userLog && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">視聴統計</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">総視聴時間:</span>
                    <span className="font-medium">{formatTime(userLog.watchedSeconds)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ステータス:</span>
                    <span className={`font-medium ${userLog.isCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
                      {userLog.isCompleted ? '視聴完了' : '視聴中'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最終視聴:</span>
                    <span className="font-medium">
                      {new Date(userLog.lastWatchedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}