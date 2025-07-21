'use client'

import { useState } from 'react'

interface UnifiedUserFormProps {
  onUserCreated?: (user: any) => void
  onClose?: () => void
  standalone?: boolean
}

export default function UnifiedUserForm({ onUserCreated, onClose, standalone = false }: UnifiedUserFormProps) {
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
      console.log('🚀 統合ユーザー作成開始:', formData)
      
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
          'X-Unified-Form': 'true',
          'X-Force-Create': 'true'
        },
        body: JSON.stringify({
          ...formData,
          timestamp: uniqueTimestamp,
          source: standalone ? 'standalone' : 'modal'
        })
      })

      console.log('レスポンス状態:', response.status)
      const data = await response.json()
      console.log('レスポンスデータ:', data)

      if (response.ok && data.success) {
        const newUser = data.data
        setResult(`✅ ユーザー作成成功！
名前: ${newUser.name}
メール: ${newUser.email}
ID: ${newUser.id}
一時パスワード: ${newUser.tempPassword}`)
        
        // フォームリセット
        setFormData({ email: '', name: '', role: 'USER' })
        
        // コールバック実行
        if (onUserCreated) {
          onUserCreated(newUser)
        }
        
        // 成功音を鳴らす（ブラウザが対応している場合）
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAEASUD0//8EAP//ALahhAoCR/')
          audio.play().catch(() => {}) // エラーは無視
        } catch {}
        
        // モーダルの場合は少し待ってから閉じる
        if (onClose && !standalone) {
          setTimeout(() => {
            onClose()
            // 親ページの更新もトリガー
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('userCreated'))
            }
          }, 1500)
        }
        
        // スタンドアロンの場合は強制リロード
        if (standalone) {
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              // 強制的にキャッシュクリア
              window.location.href = window.location.href + '?refresh=' + Date.now()
            }
          }, 2000)
        }
        
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

  const generateRandomUser = () => {
    const timestamp = Date.now()
    const randomNames = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', '渡辺健太', '山田次郎', '加藤美月', '中村大輔']
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)]
    
    setFormData({
      email: `test${timestamp}@example.com`,
      name: randomName,
      role: Math.random() > 0.8 ? 'ADMIN' : 'USER'
    })
  }

  if (!standalone) {
    // モーダル版
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4 text-green-600">
            🚀 統合ユーザー作成フォーム
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

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '作成中...' : '✅ 作成'}
              </button>
              <button
                type="button"
                onClick={generateRandomUser}
                className="bg-purple-500 text-white py-2 px-3 rounded-md hover:bg-purple-600 text-sm"
              >
                🎲
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  キャンセル
                </button>
              )}
            </div>
          </form>

          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  // スタンドアロン版
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-center text-green-600 mb-6">
        🚀 統合ユーザー作成システム
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

        <div className="space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? '🔄 作成中...' : '🚀 確実に作成する'}
          </button>
          
          <button
            type="button"
            onClick={generateRandomUser}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600"
          >
            🎲 ランダムデータ生成
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        統合システム - キャッシュ完全回避
      </div>
    </div>
  )
}