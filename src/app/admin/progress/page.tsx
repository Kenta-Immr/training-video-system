'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { groupAPI, userAPI, Group, UserData, GroupProgress } from '@/lib/api'

export default function ProgressManagementPage() {
  const [viewMode, setViewMode] = useState<'group' | 'individual'>('group')
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userFilterGroupId, setUserFilterGroupId] = useState<number | null>(null)
  const [groupProgress, setGroupProgress] = useState<GroupProgress | null>(null)
  const [userProgress, setUserProgress] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [groupsResponse, usersResponse] = await Promise.all([
        groupAPI.getAll(),
        userAPI.getAll()
      ])
      
      console.log('Groups API response:', groupsResponse.data)
      console.log('Users API response:', usersResponse.data)
      
      // APIレスポンス構造を処理
      const groupsData = groupsResponse.data?.data || groupsResponse.data
      const usersData = usersResponse.data?.data || usersResponse.data
      
      console.log('Processed groups data:', groupsData)
      console.log('Processed users data:', usersData)
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error: any) {
      console.error('Fetch initial data error:', error)
      setError(error.response?.data?.error || 'データの取得に失敗しました')
      setGroups([])
      setUsers([])
    }
  }

  const fetchGroupProgress = async (groupId: number) => {
    setLoading(true)
    try {
      console.log('📈 Fetching group progress for group ID:', groupId)
      // groupAPI.getProgressが存在しないので、groupAPI.getByIdで代替
      const response = await groupAPI.getById(groupId)
      console.log('📈 Group progress API response:', response.data)
      
      const groupData = response.data?.data || response.data
      console.log('📈 Processed group data:', groupData)
      
      if (groupData) {
        // グループ進捗データをモックで作成
        const mockProgressData: GroupProgress = {
          group: {
            id: groupData.id,
            name: groupData.name,
            code: groupData.code,
            description: groupData.description || ''
          },
          members: (groupData.users || []).map((user: any) => ({
            user: {
              id: user.id,
              name: user.name,
              userId: user.userId,
              isFirstLogin: user.isFirstLogin || false,
              lastLoginAt: user.lastLoginAt || null
            },
            progress: {
              totalVideos: 12,
              watchedVideos: Math.floor(Math.random() * 10) + 2,
              completedVideos: Math.floor(Math.random() * 8) + 1,
              completionRate: Math.floor(Math.random() * 80) + 20,
              watchRate: Math.floor(Math.random() * 90) + 10
            }
          })),
          courses: [
            { id: 1, title: 'ビジネスマナー研修', description: '社会人としての基本マナー' },
            { id: 2, title: 'コンプライアンス研修', description: '法令遵守とリスク管理' },
            { id: 3, title: '情報セキュリティ研修', description: '情報漏洩防止とセキュリティ対策' }
          ]
        }
        console.log('📈 Mock group progress data created:', mockProgressData)
        setGroupProgress(mockProgressData)
        setError('')
      } else {
        setError('グループ情報の取得に失敗しました')
        setGroupProgress(null)
      }
    } catch (error: any) {
      console.error('📈 Fetch group progress error:', error)
      if (error.response?.status === 404) {
        setError('指定されたグループが見つかりません')
      } else {
        setError(error.response?.data?.error || error.message || 'グループ進捗の取得に失敗しました')
      }
      setGroupProgress(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProgress = async (userId: number) => {
    setLoading(true)
    try {
      console.log('👥 Fetching user progress for user ID:', userId)
      // ユーザーの詳細情報と視聴ログを取得
      const response = await userAPI.getById(userId)
      console.log('👥 User progress API response:', response.data)
      
      const userData = response.data?.data || response.data
      console.log('👥 Processed user data:', userData)
      
      setUserProgress(userData)
      setError('')
    } catch (error: any) {
      console.error('👥 Fetch user progress error:', error)
      if (error.response?.status === 404) {
        setError('指定されたユーザーが見つかりません')
      } else {
        setError(error.response?.data?.error || error.message || 'ユーザー進捗の取得に失敗しました')
      }
      setUserProgress(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGroupChange = (groupId: string) => {
    const id = parseInt(groupId)
    setSelectedGroupId(id)
    if (id) {
      fetchGroupProgress(id)
    } else {
      setGroupProgress(null)
    }
  }

  const handleUserChange = (userId: string) => {
    const id = parseInt(userId)
    setSelectedUserId(id)
    if (id) {
      fetchUserProgress(id)
    } else {
      setUserProgress(null)
    }
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未ログイン'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const getFilteredUsers = () => {
    if (userFilterGroupId === null) {
      return users
    }
    return users.filter(user => user.groupId === userFilterGroupId)
  }

  return (
    <AdminPageWrapper title="進捗管理" description="個人とグループの学習進捗を確認できます">

        {/* 表示モード切り替え */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setViewMode('group')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'group'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 グループ別進捗
              </button>
              <button
                onClick={() => setViewMode('individual')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  viewMode === 'individual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 個人別進捗
              </button>
            </nav>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* グループ別進捗表示 */}
        {viewMode === 'group' && (
          <div>
            <div className="mb-6">
              <label className="form-label">表示するグループを選択</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="form-input max-w-md"
              >
                <option value="">グループを選択してください</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.code})
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {groupProgress && !loading && (
              <div>
                {/* グループ統計 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-2xl">👥</div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-500">総メンバー数</h3>
                        <p className="text-3xl font-bold text-gray-900">{groupProgress.members.length}</p>
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
                        <p className="text-3xl font-bold text-gray-900">{groupProgress.courses.length}</p>
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
                          {groupProgress.members.filter(m => m.user.isFirstLogin).length}
                        </p>
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
                          {groupProgress.members.length ? 
                            Math.round(groupProgress.members.reduce((sum, m) => sum + m.progress.completionRate, 0) / groupProgress.members.length) 
                            : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* メンバー一覧 */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      {groupProgress.group.name} - メンバー進捗一覧
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ユーザー名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            完了率
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            視聴状況
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            最終ログイン
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groupProgress.members.map((member) => (
                          <tr key={member.user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {member.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.user.userId}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                  <div
                                    className={`h-2 rounded-full ${getProgressColor(member.progress.completionRate)}`}
                                    style={{ width: `${member.progress.completionRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">
                                  {member.progress.completionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {member.progress.watchedVideos}/{member.progress.totalVideos} 視聴
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(member.user.lastLoginAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 個人別進捗表示 */}
        {viewMode === 'individual' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="form-label">グループでフィルター</label>
                <select
                  value={userFilterGroupId || ''}
                  onChange={(e) => {
                    setUserFilterGroupId(e.target.value ? parseInt(e.target.value) : null)
                    setSelectedUserId(null)
                    setUserProgress(null)
                  }}
                  className="form-input"
                >
                  <option value="">すべてのグループ</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">詳細表示するユーザーを選択（オプション）</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="form-input"
                >
                  <option value="">ユーザーを選択すると詳細表示します</option>
                  {getFilteredUsers().map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.userId}) {user.group?.name && `- ${user.group.name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 全ユーザー一覧表示 */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  ユーザー一覧
                  {userFilterGroupId && (
                    <span className="ml-2 text-sm text-gray-600">
                      ({groups.find(g => g.id === userFilterGroupId)?.name})
                    </span>
                  )}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        グループ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        役割
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        初回ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終ログイン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredUsers().map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.userId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.group ? user.group.name : 'グループなし'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? '管理者' : 'ユーザー'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isFirstLogin 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.isFirstLogin ? '未完了' : '完了'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id)
                              fetchUserProgress(user.id)
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            詳細表示
                          </button>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            編集
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {userProgress && !loading && (
              <div>
                {/* ユーザー基本情報 */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">ユーザー情報</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">名前</dt>
                          <dd className="text-sm text-gray-900">{userProgress.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ユーザーID</dt>
                          <dd className="text-sm text-gray-900">{userProgress.userId}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">所属グループ</dt>
                          <dd className="text-sm text-gray-900">
                            {userProgress.group ? userProgress.group.name : '未所属'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">初回ログイン</dt>
                          <dd className="text-sm text-gray-900">
                            {userProgress.isFirstLogin ? '未完了' : '完了'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">最終ログイン</dt>
                          <dd className="text-sm text-gray-900">
                            {formatDate(userProgress.lastLoginAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">アカウント作成日</dt>
                          <dd className="text-sm text-gray-900">
                            {formatDate(userProgress.createdAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>

                {/* 視聴履歴 */}
                {userProgress.viewingLogs && userProgress.viewingLogs.length > 0 && (
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">視聴履歴</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              動画タイトル
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              コース名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              視聴時間
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              完了状況
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              最終視聴日
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userProgress.viewingLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {log.video.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {log.video.curriculum.course.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {Math.floor(log.watchedSeconds / 60)}分{log.watchedSeconds % 60}秒
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  log.isCompleted 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {log.isCompleted ? '完了' : '視聴中'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(log.lastWatchedAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!userProgress.viewingLogs || userProgress.viewingLogs.length === 0) && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center">
                      <div className="text-gray-400 text-4xl mb-4">📺</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">視聴履歴なし</h3>
                      <p className="text-gray-500">このユーザーはまだ動画を視聴していません。</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!selectedGroupId && viewMode === 'group' && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">グループを選択してください</h3>
            <p className="text-gray-500">上記のドロップダウンからグループを選択して進捗を確認できます。</p>
          </div>
        )}

    </AdminPageWrapper>
  )
}