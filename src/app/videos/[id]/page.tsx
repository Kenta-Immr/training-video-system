'use client'

// 動画視聴ページは進捗ログとユーザー情報が動的
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactPlayer from 'react-player'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { videoAPI, logAPI, Video, userAPI } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { validateAccess } from '@/lib/workingHours'

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
  const [workingHoursValid, setWorkingHoursValid] = useState(true)
  const [workingHoursMessage, setWorkingHoursMessage] = useState('')
  
  const playerRef = useRef<ReactPlayer>(null)
  const lastSavedProgressRef = useRef(0)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const viewingStartTimeRef = useRef<Date | null>(null)
  const lastActionTimeRef = useRef<Date>(new Date())

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await videoAPI.getById(videoId)
        console.log('Video API response:', response)
        
        // APIレスポンスの構造をチェック
        let videoData = response.data
        if (response.data?.data) {
          videoData = response.data.data
        }
        
        console.log('Video data after processing:', videoData)
        setVideo(videoData)
        
        // 勤務時間チェック（管理者以外）
        const user = getCurrentUser()
        if (user) {
          try {
            const userResponse = await userAPI.getMe()
            const userData = userResponse.data
            
            if (userData.role !== 'ADMIN') {
              const accessValidation = validateAccess(userData.group)
              
              if (!accessValidation.isValid) {
                setWorkingHoursValid(false)
                setWorkingHoursMessage(
                  `${accessValidation.reason}\n現在時刻: ${accessValidation.currentTime}${
                    accessValidation.allowedHours ? `\n勤務時間: ${accessValidation.allowedHours}` : ''
                  }${
                    accessValidation.allowedDays ? `\n勤務日: ${accessValidation.allowedDays.join('、')}曜日` : ''
                  }`
                )
                return
              }
            }
          } catch (userError) {
            console.error('ユーザー情報取得エラー:', userError)
          }
        }
        
        // 既存の視聴ログがあれば再生位置を復元
        if (user && videoData.viewingLogs) {
          const userLog = videoData.viewingLogs.find(log => log.userId === user.id)
          if (userLog && userLog.watchedSeconds > 0) {
            setPlayed(userLog.watchedSeconds / (duration || 1))
          }
        }
      } catch (error: any) {
        console.error('Video fetch error:', error)
        setError(error.response?.data?.message || error.response?.data?.error || '動画の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    if (videoId) {
      fetchVideo()
    }
  }, [videoId, duration])

  // キーボードショートカットによる早送りをブロック
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 矢印キー、スペースキーなどの動画制御キーをブロック
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' ', 'Space'].includes(e.key)) {
        // 右矢印キー（通常は10秒早送り）のみブロック、他は許可
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          e.stopPropagation()
          alert('早送りはできません。順序通りに動画をご視聴ください。')
          return false
        }
      }
      
      // 数字キー（0-9）による位置ジャンプもブロック
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        e.stopPropagation()
        alert('動画の位置ジャンプはできません。順序通りに動画をご視聴ください。')
        return false
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

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
        
        // 視聴セッションが進行中の場合は終了ログを送信
        if (viewingStartTimeRef.current) {
          const viewingEndTime = new Date()
          const sessionDuration = viewingEndTime.getTime() - viewingStartTimeRef.current.getTime()
          
          if (sessionDuration > 1000) { // 1秒以上の視聴のみログ記録
            // 同期的にセッションログを送信
            try {
              const sessionData = {
                videoId: video.id,
                startTime: viewingStartTimeRef.current.toISOString(),
                endTime: viewingEndTime.toISOString(),
                sessionDuration: Math.round(sessionDuration / 1000),
                videoPosition: Math.floor(played * duration)
              }
              
              // 同期的にXHRでログを送信
              const xhr = new XMLHttpRequest()
              xhr.open('POST', '/api/logs/sessions', false) // false = 同期リクエスト
              xhr.setRequestHeader('Content-Type', 'application/json')
              
              const token = localStorage.getItem('token')
              if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`)
              }
              
              xhr.send(JSON.stringify(sessionData))
              console.log('ページ離脱時セッションログ送信完了')
            } catch (error) {
              console.error('ページ離脱時セッションログ送信エラー:', error)
            }
          }
        }
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
    
    // 視聴開始時間を記録
    if (!viewingStartTimeRef.current) {
      viewingStartTimeRef.current = new Date()
      console.log('視聴開始:', viewingStartTimeRef.current)
    }
    
    // 最後の操作時間を更新
    lastActionTimeRef.current = new Date()
  }

  const handlePause = () => {
    setPlaying(false)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // 視聴終了時間を記録し、セッションログを送信
    if (viewingStartTimeRef.current) {
      const viewingEndTime = new Date()
      const sessionDuration = viewingEndTime.getTime() - viewingStartTimeRef.current.getTime()
      
      console.log('視聴終了:', {
        開始時刻: viewingStartTimeRef.current,
        終了時刻: viewingEndTime,
        セッション時間: Math.round(sessionDuration / 1000) + '秒'
      })
      
      // セッションログをAPIに送信
      if (video && sessionDuration > 1000) { // 1秒以上の視聴のみログ記録
        logAPI.saveSessionLog({
          videoId: video.id,
          startTime: viewingStartTimeRef.current.toISOString(),
          endTime: viewingEndTime.toISOString(),
          sessionDuration: Math.round(sessionDuration / 1000),
          videoPosition: Math.floor(played * duration)
        }).catch(console.error)
      }
      
      // 開始時刻をリセット（次回再生時に新しいセッションとして記録するため）
      viewingStartTimeRef.current = null
    }
    
    // 最後の操作時間を更新
    lastActionTimeRef.current = new Date()
    
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
    // 早送り制限: 現在の視聴済み位置より先には移動できない
    const maxSeekPosition = played * duration
    const requestedPosition = seconds
    
    if (requestedPosition > maxSeekPosition) {
      // 早送り試行をブロックし、許可される最大位置に戻す
      console.log('早送りブロック:', { requested: requestedPosition, max: maxSeekPosition })
      if (playerRef.current) {
        playerRef.current.seekTo(played) // 現在の視聴済み位置に戻す
      }
      // ユーザーに通知
      alert('早送りはできません。順序通りに動画をご視聴ください。')
      return
    }
    
    // 巻き戻しは許可
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

  if (!workingHoursValid) {
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-yellow-50 p-6 border border-yellow-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">動画視聴は勤務時間内のみ利用可能です</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <pre className="whitespace-pre-line">{workingHoursMessage}</pre>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/')}
                    className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md transition-colors"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            </div>
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
                onSeek={handleSeek}
                controls
                progressInterval={1000}
                config={{
                  youtube: {
                    playerVars: {
                      disablekb: 1, // キーボードコントロールを無効化
                      modestbranding: 1,
                      rel: 0
                    }
                  },
                  vimeo: {
                    playerOptions: {
                      keyboard: false, // キーボードショートカットを無効化
                    }
                  },
                  file: {
                    attributes: {
                      controlsList: 'nodownload noremoteplayback',
                      disablePictureInPicture: true,
                      onContextMenu: (e: any) => e.preventDefault(), // 右クリックメニュー無効化
                    }
                  }
                }}
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