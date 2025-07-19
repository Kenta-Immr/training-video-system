'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import AuthGuard from '@/components/AuthGuard'
import { groupAPI, GroupProgress } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

export default function GroupProgressPage() {
  const [progressData, setProgressData] = useState<GroupProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return

    setCurrentUser(user)

    const fetchUserAndProgress = async () => {
      try {
        // 現在のユーザー情報を取得してグループIDを確認
        console.log('Fetching user info...')
        const apiBaseUrl = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:3001'
        console.log('API Base URL:', apiBaseUrl)
        const userResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        })
        
        console.log('User response status:', userResponse.status)
        
        if (!userResponse.ok) {
          if (userResponse.status === 401 || userResponse.status === 403) {
            // トークンが無効な場合、ログアウトしてログインページにリダイレクト
            localStorage.removeItem('token')
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return
          }
          throw new Error(`ユーザー情報の取得に失敗しました (Status: ${userResponse.status})`)
        }

        const userData = await userResponse.json()
        console.log('User data:', userData)
        
        if (!userData.groupId) {
          setError('グループに所属していません')
          setLoading(false)
          return
        }

        // グループの進捗を取得
        console.log('Fetching progress for group ID:', userData.groupId)
        console.log('groupAPI.getProgress:', typeof groupAPI.getProgress)
        
        // 直接fetchを使用してテスト
        const progressResponse = await fetch(`${apiBaseUrl}/api/groups/${userData.groupId}/progress`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Progress response status:', progressResponse.status)
        
        if (!progressResponse.ok) {
          const errorText = await progressResponse.text()
          console.error('Progress response error:', errorText)
          throw new Error(`グループ進捗取得に失敗しました (Status: ${progressResponse.status}): ${errorText}`)
        }
        
        const progressData = await progressResponse.json()
        console.log('Group progress data:', progressData)
        setProgressData(progressData)
      } catch (error: any) {
        console.error('Group progress error:', error)
        console.error('Error response:', error.response)
        console.error('Error message:', error.message)
        
        if (error.response?.status === 403) {
          setError('グループの進捗を確認する権限がありません')
        } else if (error.response?.status === 404) {
          setError('グループが見つかりません')
        } else {
          setError(`グループ進捗の取得に失敗しました: ${error.response?.data?.error || error.message || '不明なエラー'}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProgress()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
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

  if (error) {
    const isAuthError = error.includes('Status: 401') || error.includes('Status: 403')
    
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`rounded-md p-4 ${isAuthError ? 'bg-red-50' : 'bg-yellow-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${isAuthError ? 'text-red-400' : 'text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${isAuthError ? 'text-red-800' : 'text-yellow-800'}`}>{error}</p>
                {isAuthError && (
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        localStorage.removeItem('token')
                        if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      再ログインする
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </AuthGuard>
    )
  }

  if (!progressData) {
    return (
      <AuthGuard>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">グループ情報が見つかりません</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {progressData.group.name} - グループ進捗
          </h1>
          <p className="mt-2 text-gray-600">
            あなたと同じグループのメンバーの学習進捗を確認できます
          </p>
        </div>

        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">グループメンバー数</h3>
            <p className="text-3xl font-bold text-gray-900">{progressData.members.length}人</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">学習対象コース数</h3>
            <p className="text-3xl font-bold text-gray-900">{progressData.courses.length}コース</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">グループ平均完了率</h3>
            <p className="text-3xl font-bold text-blue-600">
              {progressData.members.length ? 
                Math.round(progressData.members.reduce((sum, m) => sum + m.progress.completionRate, 0) / progressData.members.length) 
                : 0}%
            </p>
          </div>
        </div>

        {/* メンバー進捗一覧 */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">メンバー学習状況</h2>
          </div>

          <div className="grid gap-4 p-6">
            {progressData.members
              .sort((a, b) => b.progress.completionRate - a.progress.completionRate)
              .map((member) => (
              <div 
                key={member.user.id} 
                className={`border rounded-lg p-4 ${
                  member.user.id === currentUser?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      member.user.id === currentUser?.id ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {member.user.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {member.user.name}
                        {member.user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-blue-600 font-medium">(あなた)</span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-500">
                        最終ログイン: {formatDate(member.user.lastLoginAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {member.progress.completionRate}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.progress.completedVideos}/{member.progress.totalVideos} 完了
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">学習完了率</span>
                    <span className="font-medium">{member.progress.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(member.progress.completionRate)}`}
                      style={{ width: `${member.progress.completionRate}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>視聴済み: {member.progress.watchedVideos}動画</span>
                    <span>完了済み: {member.progress.completedVideos}動画</span>
                  </div>
                </div>

                {member.user.isFirstLogin && (
                  <div className="mt-3 flex items-center text-sm text-amber-600">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    初回ログイン未完了
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 学習対象コース */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">学習対象コース</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressData.courses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mb-3">{course.description}</p>
                  )}
                  <a
                    href={`/courses/${course.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    コースを開始 →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}