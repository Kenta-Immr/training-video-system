'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { groupAPI, userAPI, courseAPI, Group, UserData, Course } from '@/lib/api'

interface GroupForm {
  name: string
  code: string
  description: string
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showCoursePermissions, setShowCoursePermissions] = useState(false)
  const [groupCourses, setGroupCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupForm>()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError('')
      console.log('グループデータ取得開始', forceRefresh ? '(強制更新)' : '')
      
      const [groupsResponse, usersResponse, coursesResponse] = await Promise.all([
        groupAPI.getAll(),
        userAPI.getAll(),
        courseAPI.getAll()
      ])
      
      console.log('Groups API response:', groupsResponse)
      console.log('Users API response:', usersResponse)
      console.log('Courses API response:', coursesResponse)
      
      // APIレスポンス構造を処理
      const groupsData = groupsResponse.data?.data || groupsResponse.data
      const usersData = usersResponse.data?.data || usersResponse.data
      const coursesData = coursesResponse.data?.data || coursesResponse.data
      
      console.log('Processed groups data:', {
        type: typeof groupsData,
        isArray: Array.isArray(groupsData),
        length: Array.isArray(groupsData) ? groupsData.length : 'not array',
        data: groupsData
      })
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
    } catch (error: any) {
      console.error('Fetch data error:', error)
      setError(error.response?.data?.error || error.message || 'データの取得に失敗しました')
      // エラー時は空配列でフォールバック
      setGroups([])
      setUsers([])
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: GroupForm) => {
    try {
      if (editingGroup) {
        await groupAPI.update(editingGroup.id, data)
      } else {
        await groupAPI.create(data)
      }
      
      reset()
      setShowForm(false)
      setEditingGroup(null)
      
      // データ保存後の強制リフレッシュ（遅延付き）
      console.log('グループ作成完了、リフレッシュを実行します...')
      setTimeout(() => {
        console.log('500ms後のリフレッシュ実行')
        fetchData(true)
      }, 500)
      
      // 即座にもう一度実行（二重チェック）
      setTimeout(() => {
        console.log('1500ms後の追加リフレッシュ実行')
        fetchData(true)
      }, 1500)
    } catch (error: any) {
      setError(error.response?.data?.error || 'グループの保存に失敗しました')
    }
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setValue('name', group.name)
    setValue('code', group.code)
    setValue('description', group.description || '')
    setShowForm(true)
  }

  const handleDelete = async (group: Group) => {
    if (!confirm(`「${group.name}」を削除しますか？`)) return

    try {
      await groupAPI.delete(group.id)
      fetchData()
    } catch (error: any) {
      setError(error.response?.data?.error || 'グループの削除に失敗しました')
    }
  }

  const handleAddUsers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return

    try {
      await groupAPI.addUsers(selectedGroup.id, selectedUsers)
      setSelectedUsers([])
      setSelectedGroup(null)
      fetchData()
    } catch (error: any) {
      setError(error.response?.data?.error || 'ユーザーの追加に失敗しました')
    }
  }

  const handleRemoveUser = async (groupId: number, userId: number) => {
    try {
      await groupAPI.removeUsers(groupId, [userId])
      fetchData()
    } catch (error: any) {
      setError(error.response?.data?.error || 'ユーザーの削除に失敗しました')
    }
  }

  const handleCancel = () => {
    reset()
    setShowForm(false)
    setEditingGroup(null)
  }

  const getUnassignedUsers = () => {
    return users.filter(user => !user.groupId)
  }

  const handleShowCoursePermissions = async (group: Group) => {
    try {
      const response = await groupAPI.getCourses(group.id)
      setGroupCourses(response.data)
      setSelectedGroup(group)
      setShowCoursePermissions(true)
    } catch (error: any) {
      setError(error.response?.data?.error || 'コース権限の取得に失敗しました')
    }
  }

  const handleAddCoursePermissions = async () => {
    if (!selectedGroup || selectedCourses.length === 0) return

    try {
      await groupAPI.addCourses(selectedGroup.id, selectedCourses)
      setSelectedCourses([])
      // 権限を再取得
      const response = await groupAPI.getCourses(selectedGroup.id)
      setGroupCourses(response.data)
    } catch (error: any) {
      setError(error.response?.data?.error || 'コース権限の追加に失敗しました')
    }
  }

  const handleRemoveCoursePermission = async (courseId: number) => {
    if (!selectedGroup) return

    try {
      await groupAPI.removeCourses(selectedGroup.id, [courseId])
      // 権限を再取得
      const response = await groupAPI.getCourses(selectedGroup.id)
      setGroupCourses(response.data)
    } catch (error: any) {
      setError(error.response?.data?.error || 'コース権限の削除に失敗しました')
    }
  }

  const getAvailableCourses = () => {
    const assignedCourseIds = groupCourses.map(course => course.id)
    return courses.filter(course => !assignedCourseIds.includes(course.id))
  }

  return (
    <AdminPageWrapper title="グループ管理" description="受講者をグループ分けして管理できます">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">グループ管理</h1>
              <p className="mt-2 text-gray-600">受講者をグループ分けして管理できます</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              新規グループ作成
            </button>
          </div>
        </div>

        {/* グループコード案内 */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <div className="text-blue-600 text-2xl mr-3">💡</div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">受講生自己登録について</h3>
              <p className="text-blue-800 text-sm">
                受講生が自己登録時にグループコードを入力すると、自動的に該当グループに参加します。
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* グループ作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingGroup ? 'グループ編集' : '新規グループ作成'}
              </h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">グループ名</label>
                  <input
                    {...register('name', { required: 'グループ名は必須です' })}
                    className="form-input"
                    placeholder="グループ名を入力"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">グループコード</label>
                  <input
                    {...register('code', { required: 'グループコードは必須です' })}
                    className="form-input"
                    placeholder="受講生が入力するコード（例：TEAM_A）"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    受講生が自己登録時に入力するコードです
                  </p>
                </div>

                <div>
                  <label className="form-label">説明</label>
                  <textarea
                    {...register('description')}
                    className="form-input"
                    rows={3}
                    placeholder="グループの説明を入力"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {isSubmitting ? '保存中...' : '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-secondary flex-1"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ユーザー追加モーダル */}
        {selectedGroup && !showCoursePermissions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                「{selectedGroup.name}」にユーザーを追加
              </h2>
              
              {/* デバッグ情報 */}
              <div className="mb-4 p-2 bg-gray-50 text-xs text-gray-600 rounded">
                <p>全ユーザー数: {users.length}</p>
                <p>未割り当てユーザー数: {getUnassignedUsers().length}</p>
                <p>グループ所属ユーザー数: {users.filter(u => u.groupId).length}</p>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {getUnassignedUsers().length > 0 ? (
                  getUnassignedUsers().map((user) => (
                    <label key={user.id} className="flex items-start p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id])
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                          }
                        }}
                        className="mr-3 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        {user.role === 'ADMIN' && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            管理者
                          </span>
                        )}
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">未割り当てのユーザーがいません</p>
                    </div>
                    
                    {/* 全ユーザー表示（デバッグ用） */}
                    <details className="border border-gray-200 rounded p-2">
                      <summary className="text-xs text-gray-600 cursor-pointer">全ユーザー表示（デバッグ）</summary>
                      <div className="mt-2 space-y-1">
                        {users.map((user) => (
                          <div key={user.id} className="text-xs p-1 bg-gray-50 rounded">
                            <span className="font-medium">{user.name}</span> ({user.email})
                            <span className="ml-2 text-gray-500">
                              Group: {user.groupId ? `${user.groupId} (${user.group?.name})` : 'なし'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleAddUsers}
                  disabled={selectedUsers.length === 0}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  追加
                </button>
                <button
                  onClick={() => {
                    setSelectedGroup(null)
                    setSelectedUsers([])
                  }}
                  className="btn-secondary flex-1"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* コース権限管理モーダル */}
        {selectedGroup && showCoursePermissions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                「{selectedGroup.name}」のコース権限管理
              </h2>
              
              {/* 現在の権限 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">現在のコース権限</h3>
                {groupCourses.length > 0 ? (
                  <div className="space-y-2">
                    {groupCourses.map((course) => (
                      <div key={course.id} className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                        <div>
                          <div className="font-medium text-green-900">{course.title}</div>
                          {course.description && (
                            <div className="text-sm text-green-700">{course.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCoursePermission(course.id)}
                          className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">このグループにはまだコース権限が設定されていません</p>
                )}
              </div>

              {/* 新しい権限を追加 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">コース権限を追加</h3>
                {getAvailableCourses().length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {getAvailableCourses().map((course) => (
                      <label key={course.id} className="flex items-start p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCourses([...selectedCourses, course.id])
                            } else {
                              setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                            }
                          }}
                          className="mr-3 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{course.title}</div>
                          {course.description && (
                            <div className="text-sm text-gray-600">{course.description}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">追加可能なコースがありません</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={handleAddCoursePermissions}
                  disabled={selectedCourses.length === 0}
                  className="btn-primary disabled:opacity-50"
                >
                  選択したコースを追加
                </button>
                <button
                  onClick={() => {
                    setShowCoursePermissions(false)
                    setSelectedGroup(null)
                    setSelectedCourses([])
                    setGroupCourses([])
                  }}
                  className="btn-secondary"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* グループ一覧 */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-gray-600 mt-1">{group.description}</p>
                    )}
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">
                        {group.users?.length || 0} 名のメンバー
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">グループコード</span>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="px-3 py-2 bg-white border text-lg font-mono font-bold text-blue-800 rounded">
                                {group.code}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(group.code)
                                  alert('コードをコピーしました')
                                }}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                title="コピー"
                              >
                                📋 コピー
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="btn-secondary text-sm"
                    >
                      ユーザー追加
                    </button>
                    <button
                      onClick={() => handleShowCoursePermissions(group)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      コース権限
                    </button>
                    <button
                      onClick={() => handleEdit(group)}
                      className="btn-secondary text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(group)}
                      className="btn-danger text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* グループメンバー一覧 */}
                {group.users && group.users.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">メンバー</h4>
                    <div className="space-y-2">
                      {group.users.map((user) => (
                        <div key={user.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <div>
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-gray-500 ml-2">({user.email})</span>
                            {user.role === 'ADMIN' && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                管理者
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveUser(group.id, user.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">グループがまだ作成されていません</p>
          </div>
        )}

    </AdminPageWrapper>
  )
}