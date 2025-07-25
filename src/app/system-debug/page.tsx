'use client'

import { useState } from 'react'

export default function SystemDebugPage() {
  const [initResult, setInitResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [healthStatus, setHealthStatus] = useState<any>(null)

  const initializeProductionData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/system/production-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const result = await response.json()
      setInitResult(result)
      console.log('初期化結果:', result)
    } catch (error) {
      console.error('初期化エラー:', error)
      setInitResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/system/health')
      const result = await response.json()
      setHealthStatus(result)
      console.log('システム状態:', result)
    } catch (error) {
      console.error('ヘルスチェックエラー:', error)
      setHealthStatus({ error: error.message })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 システムデバッグダッシュボード
          </h1>

          <div className="space-y-6">
            {/* データ初期化セクション */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📊 本番データ初期化
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                本番環境でコース、ユーザー、グループの基本データを初期化します。
              </p>
              <button
                onClick={initializeProductionData}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '初期化中...' : 'データ初期化実行'}
              </button>
              
              {initResult && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <h3 className="font-medium text-gray-800 mb-2">初期化結果:</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(initResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* システム状態チェック */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🔍 システム状態チェック
              </h2>
              <button
                onClick={checkSystemHealth}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                ヘルスチェック実行
              </button>
              
              {healthStatus && (
                <div className="mt-4 p-3 bg-gray-100 rounded">
                  <h3 className="font-medium text-gray-800 mb-2">システム状態:</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(healthStatus, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* クイックリンク */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🔗 クイックリンク
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <a
                  href="/api/courses"
                  target="_blank"
                  className="block p-3 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-center text-sm"
                >
                  📚 コースAPI
                </a>
                <a
                  href="/api/videos"
                  target="_blank"
                  className="block p-3 bg-green-50 text-green-700 rounded hover:bg-green-100 text-center text-sm"
                >
                  🎥 動画API
                </a>
                <a
                  href="/api/users"
                  target="_blank"
                  className="block p-3 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-center text-sm"
                >
                  👥 ユーザーAPI
                </a>
                <a
                  href="/api/groups"
                  target="_blank"
                  className="block p-3 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 text-center text-sm"
                >
                  🏢 グループAPI
                </a>
                <a
                  href="/api/system/diagnostics"
                  target="_blank"
                  className="block p-3 bg-red-50 text-red-700 rounded hover:bg-red-100 text-center text-sm"
                >
                  🔧 診断API
                </a>
                <a
                  href="/"
                  className="block p-3 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 text-center text-sm"
                >
                  🏠 ホーム
                </a>
              </div>
            </div>

            {/* 環境情報 */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                🌍 環境情報
              </h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 80) + '...' : 'N/A'}</p>
                <p><strong>現在時刻:</strong> {new Date().toLocaleString('ja-JP')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}