'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { authAPI, LoginRequest } from '@/lib/api'
import { setToken } from '@/lib/auth'

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
    setLoading(true)
    setError('')

    try {
      console.log('=== LOGIN ATTEMPT START ===')
      console.log('Form data:', data)
      console.log('API Base URL:', process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001')
      
      const response = await authAPI.login(data)
      console.log('=== LOGIN SUCCESS ===')
      console.log('Response:', response.data)
      
      setToken(response.data.token)
      
      // ログイン成功後のリダイレクト
      window.location.href = '/'
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===')
      console.error('Full error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      if (error.response?.status === 401) {
        setError(error.response?.data?.message || 'メールアドレスまたはパスワードが間違っています')
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
                <strong>管理者:</strong> admin@test.com / password
              </div>
              <div>
                <strong>一般ユーザー:</strong> test@test.com / test
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@test.com')
                  setValue('password', 'password')
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                管理者でログイン
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'test@test.com')
                  setValue('password', 'test')
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
              <label htmlFor="email" className="form-label">
                メールアドレス
              </label>
              <input
                {...register('email', {
                  required: 'メールアドレスは必須です',
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

        </form>
      </div>
    </div>
  )
}