'use client'

import { useEffect, useState } from 'react'

interface User {
  id: number
  name: string
  userId: string
  role: string
  createdAt: string
}

export default function RealtimeUserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const timestamp = Date.now()
      
      console.log('リアルタイムユーザー一覧取得開始...')
      
      const response = await fetch(`/api/get-users?_=${timestamp}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      const data = await response.json()
      console.log('リアルタイム取得結果:', data)

      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data)
        setLastUpdate(new Date().toLocaleTimeString('ja-JP'))
        console.log(`✅ ユーザー数: ${data.data.length}件`)
      } else {
        console.warn('無効なデータ形式:', data)
        setUsers([])
      }
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    
    // 10秒ごとに自動更新
    const interval = setInterval(fetchUsers, 10000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p>ユーザー一覧を読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">リアルタイムユーザー一覧</h2>
        <div className="text-sm text-gray-500">
          最終更新: {lastUpdate}
          <button 
            onClick={fetchUsers}
            className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
          >
            🔄 更新
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>ユーザーが登録されていません</p>
          <p className="text-sm mt-2">上記のフォームでユーザーを作成してください</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  名前
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザーID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  権限
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {user.userId}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'ADMIN' ? '管理者' : '一般ユーザー'}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        合計 {users.length} 名のユーザーが登録されています
      </div>
    </div>
  )
}