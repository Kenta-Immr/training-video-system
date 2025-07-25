'use client'

// ログインページは認証状態によって動的に変化
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { setCurrentUser, setToken } from '@/lib/auth'
import { LoginRequest, authAPI, userAPI } from '@/lib/api'
import { validateAccess } from '@/lib/workingHours'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    console.log('=== SUBMIT HANDLER CALLED ===')
    console.log('Received data:', data, 'Login mode:', loginMode)
    
    // ユーザーIDとパスワードのバリデーション
    if (!data.userId || !data.password) {
      setError('ユーザーIDとパスワードを入力してください')
      return
    }
    
    const loginData: LoginRequest = {
      userId: data.userId,
      password: data.password
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('=== LOGIN ATTEMPT START ===')
      console.log('Form data:', loginData)
      console.log('API Base URL:', process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3000')
      
      const response = await authAPI.login(loginData)
      console.log('=== LOGIN SUCCESS ===')
      console.log('Response:', response.data)
      
      setToken(response.data.token)
      
      // ユーザー情報を取得してグループの勤務時間をチェック
      try {
        const userResponse = await userAPI.getMe()
        const user = userResponse.data
        
        // 管理者は勤務時間チェックをスキップ
        if (user.role === 'ADMIN') {
          console.log('管理者ログイン - 勤務時間チェックをスキップ')
          window.location.href = '/'
          return
        }
        
        // 一般ユーザーは勤務時間をチェック
        const accessValidation = validateAccess(user.group)
        
        if (!accessValidation.isValid) {
          // 勤務時間外の場合はログアウトしてエラー表示
          localStorage.removeItem('token')
          setError(`${accessValidation.reason}\n現在時刻: ${accessValidation.currentTime}${
            accessValidation.allowedHours ? `\n勤務時間: ${accessValidation.allowedHours}` : ''
          }${
            accessValidation.allowedDays ? `\n勤務日: ${accessValidation.allowedDays.join('、')}曜日` : ''
          }`)
          return
        }
        
        console.log('勤務時間チェック通過 - リダイレクト中...')
        window.location.href = '/'
        
      } catch (userError: any) {
        console.error('ユーザー情報取得エラー:', userError)
        // ユーザー情報が取得できない場合でもログインは継続
        window.location.href = '/'
      }
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===')
      console.error('Full error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      if (error.response?.status === 401) {
        setError(error.response?.data?.message || 'ユーザーIDまたはパスワードが間違っています')
      } else if (error.response?.status === 404) {
        setError('APIエンドポイントが見つかりません')
      } else if (error.response?.status === 405) {
        setError('APIメソッドエラーです')
      } else if (error.code === 'ERR_NETWORK') {
        setError('ネットワークエラーが発生しました。しばらく待ってから再試行してください。')
      } else {
        setError(`ログインに失敗しました: ${error.response?.status || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const onDebugSubmit = async (data: LoginRequest) => {
    console.log('=== DEBUG SUBMIT DATA ===')
    console.log('Form data received:', data)
    console.log('UserId:', data?.userId)
    console.log('Password:', data?.password)
    
    if (!data?.userId || !data?.password) {
      setError('デバッグ: フォームデータが正しく取得できませんでした')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('=== DEBUG LOGIN ATTEMPT ===')
      const response = await authAPI.debugLogin(data)
      console.log('=== DEBUG LOGIN SUCCESS ===')
      console.log('Response:', response.data)
      
      setToken(response.data.token)
      window.location.href = '/'
    } catch (error: any) {
      console.error('=== DEBUG LOGIN ERROR ===')
      console.error('Error:', error)
      setError(`デバッグログインエラー: ${error.response?.status || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            研修動画システム
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントにログインしてください
          </p>
          
          {/* サンプルアカウント情報 */}
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800">テストアカウント</h3>
            <div className="mt-2 text-xs text-blue-700 space-y-1">
              <div>
                <strong>管理者:</strong> ユーザーID: admin / パスワード: admin123
              </div>
              <div>
                <strong>一般ユーザー:</strong> ユーザーID: user1 / パスワード: user123
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  // デモ管理者として直接ログイン
                  setToken('demo-admin')
                  window.location.href = '/admin'
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                管理者でログイン
              </button>
              <button
                type="button"
                onClick={() => {
                  // デモユーザーとして直接ログイン
                  setToken('demo-user')
                  window.location.href = '/'
                }}
                className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                ユーザーでログイン
              </button>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="userId" className="form-label">
                ユーザーID
              </label>
              <input
                {...register('userId', {
                  required: 'ユーザーIDは必須です',
                })}
                type="text"
                className="form-input"
                placeholder="ユーザーIDを入力"
              />
              {errors.userId && (
                <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                パスワード
              </label>
              <input
                {...register('password', {
                  required: 'パスワードは必須です',
                  minLength: {
                    value: 4,
                    message: 'パスワードは4文字以上で入力してください',
                  },
                })}
                type="password"
                className="form-input"
                placeholder="パスワードを入力"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSubmit(onDebugSubmit)}
              disabled={loading}
              className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'デバッグログイン中...' : 'デバッグログイン (開発用)'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}