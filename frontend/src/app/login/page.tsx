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
      console.log('Login attempt:', data.email)
      const response = await authAPI.login(data)
      console.log('Login successful:', response.data)
      setToken(response.data.token)
      
      // ログイン成功後のリダイレクト
      window.location.href = '/'
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.response?.data?.error || 'ログインに失敗しました')
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