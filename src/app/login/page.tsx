'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { setCurrentUser, setToken } from '@/lib/auth'
import { LoginRequest, authAPI } from '@/lib/api'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginMode, setLoginMode] = useState<'email' | 'userId'>('userId') // デフォルトをuserIdに
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
    
    // ログインモードに応じてデータを準備
    const loginData: LoginRequest = {
      password: data.password
    }
    
    if (loginMode === 'userId') {
      loginData.userId = data.userId
      if (!data.userId || !data.password) {
        setError('ユーザーIDとパスワードを入力してください')
        return
      }
    } else {
      loginData.email = data.email
      if (!data.email || !data.password) {
        setError('メールアドレスとパスワードを入力してください')
        return
      }
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
      
      // ログイン成功後のリダイレクト
      console.log('Redirecting to home...')
      window.location.href = '/'
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===')
      console.error('Full error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      if (error.response?.status === 401) {
        setError(error.response?.data?.message || 'ユーザーIDまたはメールアドレス、パスワードが間違っています')
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
    console.log('Email:', data?.email)
    console.log('Password:', data?.password)
    
    if (!data?.email || !data?.password) {
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
          {/* ログインモード選択 */}
          <div className="flex justify-center space-x-4 mb-4">
            <button
              type="button"
              onClick={() => setLoginMode('userId')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                loginMode === 'userId'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ユーザーIDでログイン
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                loginMode === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              メールアドレスでログイン
            </button>
          </div>
          
          <div className="rounded-md shadow-sm space-y-4">
            {loginMode === 'userId' ? (
              <div>
                <label htmlFor="userId" className="form-label">
                  ユーザーID
                </label>
                <input
                  {...register('userId', {
                    required: loginMode === 'userId' ? 'ユーザーIDは必須です' : false,
                  })}
                  type="text"
                  className="form-input"
                  placeholder="ユーザーIDを入力"
                />
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="form-label">
                  メールアドレス
                </label>
                <input
                  {...register('email', {
                    required: loginMode === 'email' ? 'メールアドレスは必須です' : false,
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: '有効なメールアドレスを入力してください',
                    },
                  })}
                  type="email"
                  className="form-input"
                  placeholder="メールアドレスを入力"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            )}

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