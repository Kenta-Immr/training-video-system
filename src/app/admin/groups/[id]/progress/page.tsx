'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { groupAPI, GroupProgress } from '@/lib/api'

export default function GroupProgressPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params?.id ? parseInt(params.id as string) : null
  
  const [progressData, setProgressData] = useState<GroupProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'completionRate' | 'lastLogin'>('completionRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'firstLogin' | 'completed' | 'behind'>('all')
  const [lineMessages, setLineMessages] = useState<{good: string[], behind: string[]} | null>(null)
  const [showLineMessages, setShowLineMessages] = useState(false)
  
  console.log('📈 GroupProgressPage rendering, groupId:', groupId)

  useEffect(() => {
    const fetchProgress = async () => {
      if (!groupId) {
        setError('無効なグループIDです')
        setLoading(false)
        return
      }
      
      try {
        console.log('📈 Fetching group progress for ID:', groupId)
        // 実際のグループ進捗APIを呼び出し
        const response = await groupAPI.getProgress(groupId)
        console.log('📈 Group progress API response:', response.data)
        
        const progressData = response.data?.data || response.data
        console.log('📈 Processed progress data:', progressData)
        
        if (progressData) {
          setProgressData(progressData)
        } else {
          setError('グループ進捗情報の取得に失敗しました')
        }
      } catch (error: any) {
        console.error('📈 Fetch progress error:', error)
        if (error.response?.status === 404) {
          setError('指定されたグループが見つかりません')
        } else {
          setError(error.response?.data?.error || error.message || 'グループ進捗の取得に失敗しました')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [groupId])

  const generateLineMessages = () => {
    if (!progressData) return

    const groupName = progressData.group.name
    const goodPerformers = progressData.members.filter(m => m.progress.completionRate >= 70)
    const behindPerformers = progressData.members.filter(m => m.progress.completionRate < 40)

    const goodMessages: string[] = []
    const behindMessages: string[] = []

    // 進捗の良いユーザーへの承認メッセージ
    goodPerformers.forEach(member => {
      const message = `【${groupName}研修進捗】
${member.user.name}さん、お疲れ様です！

研修動画の視聴状況を確認したところ、進捗率${member.progress.completionRate}%と非常に順調に学習を進めていただいております。

✅ 視聴完了: ${member.progress.completedVideos}本
📺 視聴済み: ${member.progress.watchedVideos}本
📊 完了率: ${member.progress.completionRate}%

このペースで継続していけば、研修期間内に余裕を持って完了できそうですね。引き続き頑張ってください！

ご不明な点がございましたら、いつでもお声がけください。`

      goodMessages.push(message)
    })

    // 進捗の遅れているユーザーへのフィードバック
    behindPerformers.forEach(member => {
      const message = `【${groupName}研修進捗確認】
${member.user.name}さん、お疲れ様です。

研修動画の進捗状況を確認させていただきました。

📊 現在の進捗: ${member.progress.completionRate}%
📺 視聴済み: ${member.progress.watchedVideos}本
⏰ 最終ログイン: ${member.user.lastLoginAt ? new Date(member.user.lastLoginAt).toLocaleDateString() : '未ログイン'}

研修の進捗がやや遅れているようです。もし何かお困りの点やご質問がございましたら、お気軽にご相談ください。

研修期間内での完了を目指し、できる範囲で学習を進めていただければと思います。サポートが必要でしたらいつでもお声がけください。

よろしくお願いいたします。`

      behindMessages.push(message)
    })

    setLineMessages({ good: goodMessages, behind: behindMessages })
    setShowLineMessages(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('メッセージをクリップボードにコピーしました')
    })
  }

  const filteredAndSortedMembers = progressData?.members
    .filter((member) => {
      switch (filterStatus) {
        case 'active':
          return !member.user.isFirstLogin
        case 'firstLogin':
          return member.user.isFirstLogin
        case 'completed':
          return member.progress.completionRate >= 80
        case 'behind':
          return member.progress.completionRate < 30
        default:
          return true
      }
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.user.name
          bValue = b.user.name
          break
        case 'completionRate':
          aValue = a.progress.completionRate
          bValue = b.progress.completionRate
          break
        case 'lastLogin':
          aValue = a.user.lastLoginAt ? new Date(a.user.lastLoginAt).getTime() : 0
          bValue = b.user.lastLoginAt ? new Date(b.user.lastLoginAt).getTime() : 0
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: 'name' | 'completionRate' | 'lastLogin') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    if (rate >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getRowBackgroundColor = (rate: number) => {
    if (rate <= 10) return 'bg-red-50 border-l-4 border-red-500'
    if (rate <= 20) return 'bg-orange-50 border-l-4 border-orange-500'
    if (rate <= 30) return 'bg-yellow-50 border-l-4 border-yellow-500'
    return 'hover:bg-gray-50'
  }

  const getProgressStatus = (rate: number) => {
    if (rate <= 10) return { label: '緊急', color: 'bg-red-100 text-red-800', icon: '🚨' }
    if (rate <= 20) return { label: '遅れ', color: 'bg-orange-100 text-orange-800', icon: '⚠️' }
    if (rate <= 30) return { label: '注意', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' }
    if (rate < 70) return { label: '通常', color: 'bg-blue-100 text-blue-800', icon: '📚' }
    return { label: '順調', color: 'bg-green-100 text-green-800', icon: '🎯' }
  }

  if (loading) {
    return (
      <AdminPageWrapper title="グループ進捗" description="グループメンバーの学習進捗を確認できます">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (error || !progressData) {
    return (
      <AdminPageWrapper title="グループ進捗" description="グループメンバーの学習進捗を確認できます">
        <div className="text-center py-12">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error || 'グループ進捗データが見つかりません'}</p>
          </div>
          <button
            onClick={() => router.push('/admin/groups')}
            className="btn-primary"
          >
            グループ管理に戻る
          </button>
        </div>
      </AdminPageWrapper>
    )
  }

  console.log('📈 About to render GroupProgressPage content')
  
  return (
    <AdminPageWrapper title="グループ進捗" description="グループメンバーの学習進捗を確認できます">
      {/* デバッグ情報 */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">✅ グループ進捗ページが正常に読み込まれました</h2>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• コンポーネント名: GroupProgressPage</p>
          <p>• グループID: {groupId}</p>
          <p>• グループ名: {progressData?.group.name}</p>
          <p>• メンバー数: {progressData?.members.length}人</p>
          <p>• 対象コース数: {progressData?.courses.length}個</p>
        </div>
      </div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {progressData?.group.name} - 進捗管理
              </h1>
              <p className="mt-2 text-gray-600">
                グループコード: {progressData?.group.code}
              </p>
            </div>
            <Link
              href="/admin/groups"
              className="btn-secondary"
            >
              グループ管理に戻る
            </Link>
          </div>
        </div>

        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">👥</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">総メンバー数</h3>
                <p className="text-3xl font-bold text-gray-900">{progressData?.members.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📚</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">対象コース数</h3>
                <p className="text-3xl font-bold text-gray-900">{progressData?.courses.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">🔴</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">初回ログイン未完了</h3>
                <p className="text-3xl font-bold text-red-600">
                  {progressData?.members.filter(m => m.user.isFirstLogin).length}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  {progressData?.members.length ? 
                    Math.round((progressData.members.filter(m => m.user.isFirstLogin).length / progressData.members.length) * 100)
                    : 0}% がアクティブ待ち
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl">📊</div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">平均完了率</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {progressData?.members.length ? 
                    Math.round(progressData.members.reduce((sum, m) => sum + m.progress.completionRate, 0) / progressData.members.length) 
                    : 0}%
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  グループ全体の平均進捗
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 追加統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <h3 className="text-sm font-medium text-green-700 mb-2">🎯 完了率80%以上</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-green-800">
                {progressData?.members.filter(m => m.progress.completionRate >= 80).length || 0}
              </p>
              <p className="text-sm text-green-600">
                /{progressData?.members.length || 0}人
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
            <h3 className="text-sm font-medium text-red-700 mb-2">🚨 緊急対応 (10%以下)</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-red-800">
                {progressData?.members.filter(m => m.progress.completionRate <= 10).length || 0}
              </p>
              <p className="text-sm text-red-600">
                督促必要
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
            <h3 className="text-sm font-medium text-orange-700 mb-2">⚠️ 遅れ (11-20%)</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-orange-800">
                {progressData?.members.filter(m => m.progress.completionRate > 10 && m.progress.completionRate <= 20).length || 0}
              </p>
              <p className="text-sm text-orange-600">
                要注意
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-700 mb-2">⏰ 注意 (21-30%)</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-yellow-800">
                {progressData?.members.filter(m => m.progress.completionRate > 20 && m.progress.completionRate <= 30).length || 0}
              </p>
              <p className="text-sm text-yellow-600">
                様子見
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-700 mb-2">🎥 総視聴動画数</h3>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-blue-800">
                {progressData?.members.reduce((sum, m) => sum + m.progress.watchedVideos, 0) || 0}
              </p>
              <p className="text-sm text-blue-600">
                グループ全体
              </p>
            </div>
          </div>
        </div>

        {/* メンバー進捗テーブル */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                メンバー進捗一覧 
                <span className="text-sm text-gray-500 font-normal ml-2">
                  ({filteredAndSortedMembers?.length || 0}/{progressData?.members.length || 0}人表示)
                </span>
              </h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={generateLineMessages}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm flex items-center"
                >
                  💬 LINE メッセージ生成
                </button>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="form-input text-sm"
                >
                  <option value="all">全員表示</option>
                  <option value="active">アクティブユーザー</option>
                  <option value="firstLogin">初回ログイン待ち</option>
                  <option value="completed">完了率80%以上</option>
                  <option value="behind">進捗遅れ（30%未満）</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    ユーザー名 {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('completionRate')}
                  >
                    完了率 {sortBy === 'completionRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    視聴状況
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastLogin')}
                  >
                    最終ログイン {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedMembers?.map((member) => {
                  const status = getProgressStatus(member.progress.completionRate)
                  const rowBgColor = getRowBackgroundColor(member.progress.completionRate)
                  
                  return (
                    <tr key={member.user.id} className={`transition-colors ${rowBgColor}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {member.progress.completionRate <= 30 && (
                              <span className="mr-2">{status.icon}</span>
                            )}
                            {member.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            member.user.isFirstLogin 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {member.user.isFirstLogin ? '初回ログイン未完了' : 'アクティブ'}
                          </span>
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(member.progress.completionRate)}`}
                              style={{ width: `${member.progress.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">
                            {member.progress.completionRate}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {member.progress.completedVideos}/{member.progress.totalVideos} 完了
                          {member.progress.completionRate <= 20 && (
                            <span className="ml-2 text-red-600 font-medium">
                              督促対象
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.progress.watchedVideos}/{member.progress.totalVideos} 視聴
                        <div className="text-xs text-gray-500">
                          視聴率: {member.progress.watchRate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(member.user.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/users/${member.user.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細
                          </Link>
                          {member.progress.completionRate <= 20 && (
                            <Link
                              href="/admin/notifications"
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              督促
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 対象コース一覧 */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">対象コース</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressData?.courses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LINEメッセージモーダル */}
        {showLineMessages && lineMessages && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">LINE メッセージ一覧</h3>
                <button
                  onClick={() => setShowLineMessages(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* 進捗良好ユーザーへのメッセージ */}
                {lineMessages.good.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-green-700 mb-4 flex items-center">
                      🎯 進捗良好ユーザーへの承認メッセージ ({lineMessages.good.length}件)
                    </h4>
                    <div className="space-y-4">
                      {lineMessages.good.map((message, index) => (
                        <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-green-700">
                              メッセージ {index + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(message)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                            >
                              📋 コピー
                            </button>
                          </div>
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {message}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 進捗遅れユーザーへのメッセージ */}
                {lineMessages.behind.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-yellow-700 mb-4 flex items-center">
                      ⚠️ 進捗遅れユーザーへのフィードバック ({lineMessages.behind.length}件)
                    </h4>
                    <div className="space-y-4">
                      {lineMessages.behind.map((message, index) => (
                        <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium text-yellow-700">
                              メッセージ {index + 1}
                            </span>
                            <button
                              onClick={() => copyToClipboard(message)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                            >
                              📋 コピー
                            </button>
                          </div>
                          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                            {message}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lineMessages.good.length === 0 && lineMessages.behind.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    現在、メッセージが生成できる対象ユーザーがいません。
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowLineMessages(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
    </AdminPageWrapper>
  )
}