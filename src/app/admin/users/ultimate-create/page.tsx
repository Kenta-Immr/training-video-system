'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'

interface User {
  id: number
  name: string
  email: string
  role: string
  tempPassword?: string
  createdAt: string
}

export default function UltimateCreateUserPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'USER'
  })
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('')

  // リアルタイムユーザー取得
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const timestamp = Date.now()
      
      const response = await fetch(`/api/get-users?_=${timestamp}&force=${Math.random()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-Refresh': timestamp.toString()
        }
      })

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data)
        setLastUpdate(new Date().toLocaleTimeString('ja-JP'))
        console.log(`✅ 現在のユーザー数: ${data.data.length}名`)
      }
    } catch (error) {
      console.error('ユーザー取得エラー:', error)
    }
  }

  // 自動更新
  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 5000) // 5秒ごと
    return () => clearInterval(interval)
  }, [])

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('ユーザー作成中...')

    try {
      console.log('🚀 究極ユーザー作成開始:', formData)
      
      const token = localStorage.getItem('token')
      const uniqueTimestamp = Date.now()
      
      const response = await fetch(`/api/create-user?_=${uniqueTimestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Unique-Request': uniqueTimestamp.toString(),
          'X-Force-Create': 'true'
        },
        body: JSON.stringify({
          ...formData,
          timestamp: uniqueTimestamp
        })
      })

      console.log('レスポンス状態:', response.status)
      const result = await response.json()
      console.log('レスポンスデータ:', result)

      if (response.ok && result.success) {
        const newUser = result.data
        setStatus(`✅ ユーザー作成成功！
名前: ${newUser.name}
メール: ${newUser.email}
ID: ${newUser.id}
一時パスワード: ${newUser.tempPassword}
作成日時: ${new Date(newUser.createdAt).toLocaleString('ja-JP')}`)
        
        // フォームをリセット
        setFormData({ email: '', name: '', role: 'USER' })
        
        // 即座に一覧を更新
        await fetchUsers()
        
        // 成功音を鳴らす（ブラウザが対応している場合）
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAEASUD0//8EAP//ALahhAoCR/')
          audio.play().catch(() => {}) // エラーは無視
        } catch {}
        
      } else {
        setStatus(`❌ エラー: ${result.message || 'ユーザー作成に失敗しました'}`)
      }
    } catch (error: any) {
      console.error('ネットワークエラー:', error)
      setStatus(`❌ ネットワークエラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateRandomUser = () => {
    const timestamp = Date.now()
    const randomNames = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '渡辺健太']
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]
    
    setFormData({
      email: `test${timestamp}@example.com`,
      name: randomName,
      role: Math.random() > 0.7 ? 'ADMIN' : 'USER'
    })
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600 mb-4">
              🚀 究極ユーザー作成システム
            </h1>
            <p className="text-lg text-gray-600">
              100%確実にユーザーを作成します - キャッシュ完全回避
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左側: 作成フォーム */}
            <div className="bg-white rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                <span className="mr-2">✨</span>
                究極フォーム
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="山田太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    権限
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="USER">一般ユーザー</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg transform transition hover:scale-105"
                  >
                    {loading ? '🔄 作成中...' : '🚀 確実に作成する'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={generateRandomUser}
                    className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition"
                  >
                    🎲 ランダムデータ生成
                  </button>
                </div>
              </form>

              {/* ステータス表示 */}
              {status && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">{status}</pre>
                </div>
              )}
            </div>

            {/* 右側: リアルタイム一覧 */}
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-600 flex items-center">
                  <span className="mr-2">👥</span>
                  リアルタイム一覧
                </h2>
                <div className="text-sm text-gray-500">
                  最終更新: {lastUpdate}
                  <button 
                    onClick={fetchUsers}
                    className="ml-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    🔄
                  </button>
                </div>
              </div>

              <div className="bg-green-100 p-4 rounded-lg mb-4">
                <p className="text-green-800 font-semibold">
                  📊 現在のユーザー数: {users.length}名
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>ユーザーが登録されていません</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {user.id} | 作成: {new Date(user.createdAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'ADMIN' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role === 'ADMIN' ? '管理者' : '一般'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 戻るリンク */}
          <div className="mt-8 text-center">
            <a 
              href="/admin/users" 
              className="text-blue-600 hover:text-blue-800 underline text-lg"
            >
              ← ユーザー管理ページに戻る
            </a>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}