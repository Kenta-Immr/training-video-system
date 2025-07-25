'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Header from '@/components/Header'
import { userAPI } from '@/lib/api'

interface BulkCreateResult {
  success: number
  errors: number
  created: any[]
  failed: any[]
}

export default function BulkCreateUsersPage() {
  const router = useRouter()
  const [csvText, setCsvText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<BulkCreateResult | null>(null)
  const [error, setError] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvText(text)
      setError('')
    }
    reader.onerror = () => {
      setError('ファイルの読み込みに失敗しました')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleSubmit = async () => {
    if (!csvText.trim()) {
      setError('CSVデータを入力または選択してください')
      return
    }

    setIsUploading(true)
    setError('')
    setResult(null)

    try {
      const response = await userAPI.bulkCreate({
        csvText: csvText
      })
      
      const resultData = response.data?.data || response.data
      setResult(resultData)

    } catch (error: any) {
      console.error('一括ユーザー作成エラー:', error)
      
      let errorMessage = '一括ユーザー作成に失敗しました'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setCsvText('')
    setResult(null)
    setError('')
    const fileInput = document.getElementById('csv-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const downloadSampleCSV = () => {
    const sampleCSV = `userId,name,password,role,groupName
user001,山田太郎,password123,USER,営業部
user002,佐藤花子,password456,USER,技術部
user003,田中次郎,password789,ADMIN,管理部
user004,鈴木美咲,passwordabc,USER,営業部`

    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'ユーザー一括作成_サンプル.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const sampleCsv = `userId,name,password,role,groupName
user001,山田太郎,password123,USER,営業部
user002,佐藤花子,password456,USER,技術部
user003,田中次郎,password789,ADMIN,管理部
user004,鈴木美咲,passwordabc,USER,営業部`

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">一括ユーザー作成</h1>
            <p className="mt-2 text-gray-600">
              CSVファイルから複数のユーザーを一度に作成します
            </p>
          </div>
          <Link
            href="/admin/users/manage"
            className="btn-secondary"
          >
            ユーザー管理に戻る
          </Link>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
            <button 
              onClick={() => setError('')}
              className="mt-2 btn-primary text-sm"
            >
              閉じる
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSV入力エリア */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">CSVデータ入力</h2>
            
            <div className="space-y-4">
              {/* ファイルアップロード */}
              <div>
                <label className="form-label">CSVファイル選択</label>
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  .csv形式のファイルを選択してください
                </p>
              </div>

              <div className="text-center text-gray-500">または</div>

              {/* 直接入力 */}
              <div>
                <label className="form-label">CSVテキスト直接入力</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="form-input"
                  rows={10}
                  placeholder="userId,name,role,groupId&#10;yamada,山田太郎,USER,2&#10;sato,佐藤花子,ADMIN,1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1行目にヘッダー、2行目以降にデータを入力してください
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || !csvText.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isUploading ? '作成中...' : 'ユーザーを一括作成'}
                </button>
                <button
                  onClick={downloadSampleCSV}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  title="サンプルCSVファイルをダウンロード"
                >
                  📄 CSV例
                </button>
                <button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>

          {/* サンプル・説明 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">CSVフォーマット説明</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">必須フィールド</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">userId</code> - ユーザーID（必須）</li>
                  <li><code className="bg-gray-100 px-1 rounded">name</code> - ユーザー名（必須）</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">任意フィールド</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">role</code> - USER または ADMIN（デフォルト: USER）</li>
                  <li><code className="bg-gray-100 px-1 rounded">groupId</code> - グループID（1: 管理、2: 開発、3: 営業）</li>
                  <li><code className="bg-gray-100 px-1 rounded">password</code> - 初期パスワード（未指定時は自動生成）</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">サンプルCSV</h3>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{sampleCsv}
                </pre>
                <button
                  onClick={() => setCsvText(sampleCsv)}
                  className="btn-secondary text-sm mt-2"
                >
                  サンプルデータを使用
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="mt-8">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">作成結果</h2>
                <div className="flex space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    成功: {result.success}件
                  </span>
                  {result.errors > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      エラー: {result.errors}件
                    </span>
                  )}
                </div>
              </div>

              {/* 成功一覧 */}
              {result.created.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-green-900 mb-2">作成成功 ({result.created.length}件)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ユーザーID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">権限</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">グループ</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.created.map((user, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{user.userId}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role === 'ADMIN' ? '管理者' : '一般ユーザー'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {user.group ? user.group.name : '未所属'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* エラー一覧 */}
              {result.failed.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-900 mb-2">作成失敗 ({result.failed.length}件)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">行</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ユーザーID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">エラー</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.failed.map((error, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{error.index}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{error.userId}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{error.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="btn-primary"
                >
                  ユーザー管理に移動
                </button>
                <button
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  新しいCSVを作成
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}