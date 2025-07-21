'use client'

import { useState } from 'react'

export default function SimpleUserForm() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'USER'
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult('処理中...')

    try {
      const token = localStorage.getItem('token')
      console.log('==== 確実ユーザー作成開始 ====')
      console.log('フォームデータ:', formData)
      console.log('トークン:', token?.substring(0, 20) + '...')

      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Timestamp': Date.now().toString()
        },
        body: JSON.stringify(formData)
      })

      console.log('レスポンス状態:', response.status)
      console.log('レスポンスヘッダー:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('レスポンスデータ:', data)

      if (response.ok && data.success) {
        setResult(`✅ ユーザー作成成功！
名前: ${data.data.name}
メール: ${data.data.email}
ID: ${data.data.id}
一時パスワード: ${data.data.tempPassword}`)
        
        // フォームリセット
        setFormData({ email: '', name: '', role: 'USER' })
        
        // ページ全体をリロードして最新データを表示
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setResult(`❌ エラー: ${data.message || 'ユーザー作成に失敗しました'}`)
      }
    } catch (error: any) {
      console.error('ネットワークエラー:', error)
      setResult(`❌ ネットワークエラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold text-center text-green-600 mb-6">
        🚀 確実ユーザー作成システム
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            名前 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="山田太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            権限
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="USER">一般ユーザー</option>
            <option value="ADMIN">管理者</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? '作成中...' : '✅ 確実に作成する'}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        このフォームは最新技術で確実にユーザーを作成します
      </div>
    </div>
  )
}