'use client'

import { useState, useEffect } from 'react'

// 動的ページとして設定
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AuthGuard from '@/components/AuthGuard'
import { userAPI, groupAPI } from '@/lib/api'
import { isAdmin } from '@/lib/auth'

interface BulkUser {
  email: string
  name: string
  password: string
  role: 'USER' | 'ADMIN'
  groupId?: number
  groupName?: string
}

interface Group {
  id: number
  name: string
  code: string
}

export default function BulkCreateUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<BulkUser[]>([
    { email: '', name: '', password: '', role: 'USER' }
  ])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [csvData, setCsvData] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)

  // 管理者チェック（クライアントサイドのみ）
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAdmin()) {
      router.push('/')
    }
  }, [router])

  // グループ一覧を取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupAPI.getAll()
        setGroups(response.data)
      } catch (error) {
        console.error('Error fetching groups:', error)
        setGroups([])
      }
    }
    
    fetchGroups()
  }, [])

  const addUser = () => {
    setUsers([...users, { email: '', name: '', password: '', role: 'USER' }])
  }

  const removeUser = (index: number) => {
    if (users.length > 1) {
      const newUsers = users.filter((_, i) => i !== index)
      setUsers(newUsers)
    }
  }

  const updateUser = (index: number, field: keyof BulkUser, value: string | number) => {
    const newUsers = [...users]
    newUsers[index] = { ...newUsers[index], [field]: value }
    setUsers(newUsers)
  }

  const handleCsvImport = () => {
    try {
      const lines = csvData.trim().split('\n')
      const csvUsers: BulkUser[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [email, name, password, role, groupValue] = line.split(',').map(s => s.trim())
        
        if (!email || !name || !password) {
          alert(`行 ${i + 1}: メールアドレス、名前、パスワードは必須です`)
          return
        }

        // グループ値が数値かどうかで判定（後方互換性）
        const isNumericGroup = groupValue && !isNaN(parseInt(groupValue))
        
        csvUsers.push({
          email,
          name,
          password,
          role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
          groupId: isNumericGroup ? parseInt(groupValue) : undefined,
          groupName: !isNumericGroup && groupValue ? groupValue : undefined
        })
      }

      setUsers(csvUsers)
      setCsvData('')
    } catch (error) {
      alert('CSVデータの解析に失敗しました')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const template = 'email,name,password,role,groupName\n' +
                    'user1@example.com,山田太郎,password123,USER,営業部\n' +
                    'user2@example.com,田中花子,password456,USER,技術部\n' +
                    'user3@example.com,佐藤次郎,password789,USER,営業部\n' +
                    'manager@example.com,管理者,admin123,ADMIN,管理部\n' +
                    'intern@example.com,新人研修生,intern123,USER,新人研修'

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'user_template.csv'
    link.click()
  }

  const createUsersFromCsv = async () => {
    if (!csvData.trim()) {
      alert('CSVデータがありません')
      return
    }

    try {
      const lines = csvData.trim().split('\n')
      const csvUsers: BulkUser[] = []

      // ヘッダー行をスキップ
      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [email, name, password, role, groupValue] = line.split(',').map(s => s.trim())
        
        if (!email || !name || !password) {
          alert(`行 ${i + 1}: メールアドレス、名前、パスワードは必須です`)
          return
        }

        // グループ値が数値かどうかで判定（後方互換性）
        const isNumericGroup = groupValue && !isNaN(parseInt(groupValue))
        
        csvUsers.push({
          email,
          name,
          password,
          role: (role === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
          groupId: isNumericGroup ? parseInt(groupValue) : undefined,
          groupName: !isNumericGroup && groupValue ? groupValue : undefined
        })
      }

      if (csvUsers.length === 0) {
        alert('有効なユーザーデータがありません')
        return
      }

      setLoading(true)
      console.log('送信するユーザーデータ:', csvUsers)
      const response = await userAPI.bulkCreate({ users: csvUsers })
      setResult(response.data)
      setCsvData('')
      setCsvFile(null)
    } catch (error: any) {
      alert(error.response?.data?.error || 'ユーザー作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    const validUsers = users.filter(user => user.email && user.name && user.password)
    if (validUsers.length === 0) {
      alert('有効なユーザーデータがありません')
      return
    }

    setLoading(true)
    try {
      const response = await userAPI.bulkCreate({ users: validUsers })
      setResult(response.data)
    } catch (error: any) {
      alert(error.response?.data?.error || '一括作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAdmin>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">一括ユーザー作成</h1>
            <Link
              href="/admin/users"
              className="btn-secondary"
            >
              ユーザー管理に戻る
            </Link>
          </div>
        </div>

        {result ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">作成結果</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-800">成功</h3>
                <p className="text-3xl font-bold text-green-600">{result.success}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-800">失敗</h3>
                <p className="text-3xl font-bold text-red-600">{result.errors}</p>
              </div>
            </div>

            {result.failed && result.failed.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">エラー詳細</h3>
                <div className="bg-red-50 rounded-lg p-4">
                  {result.failed.map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      行 {error.index}: {error.email} - {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResult(null)
                  setUsers([{ email: '', name: '', password: '', role: 'USER' }])
                }}
                className="btn-primary"
              >
                新しく作成
              </button>
              <Link href="/admin/users" className="btn-secondary">
                ユーザー管理へ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CSV インポート */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">CSVファイルからユーザー作成</h2>
              <p className="text-gray-600 mb-4">
                CSVファイルをアップロードしてユーザーを一括作成できます。<br />
                形式: email, name, password, role, groupId
              </p>
              
              <div className="space-y-4">
                {/* テンプレートダウンロード */}
                <div className="flex gap-4">
                  <button
                    onClick={downloadTemplate}
                    className="btn-secondary"
                  >
                    📥 CSVテンプレートをダウンロード
                  </button>
                </div>

                {/* ファイルアップロード */}
                <div>
                  <label className="form-label">CSVファイルを選択</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* プレビュー */}
                {csvData && (
                  <div>
                    <label className="form-label">プレビュー</label>
                    <textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                  </div>
                )}

                {/* 作成ボタン */}
                <div className="flex gap-4">
                  <button
                    onClick={createUsersFromCsv}
                    disabled={!csvData.trim() || loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? '作成中...' : 'CSVからユーザーを作成'}
                  </button>
                  <button
                    onClick={handleCsvImport}
                    disabled={!csvData.trim()}
                    className="btn-secondary disabled:opacity-50"
                  >
                    手動入力フォームに読み込み
                  </button>
                </div>
              </div>
            </div>

            {/* 手動CSV入力 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">CSV手動入力</h2>
              <p className="text-gray-600 mb-4">
                CSVデータを直接入力してユーザーを設定できます。<br />
                形式: email, name, password, role, groupId
              </p>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="email,name,password,role,groupId&#10;user1@example.com,山田太郎,password123,USER,1&#10;user2@example.com,田中花子,password456,USER,2"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 flex gap-4">
                <button
                  onClick={createUsersFromCsv}
                  disabled={!csvData.trim() || loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? '作成中...' : 'CSVからユーザーを作成'}
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvData.trim()}
                  className="btn-secondary disabled:opacity-50"
                >
                  手動入力フォームに読み込み
                </button>
              </div>
            </div>

            {/* 手動入力フォーム */}
            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">ユーザー情報入力</h2>
                <button
                  type="button"
                  onClick={addUser}
                  className="btn-secondary"
                >
                  ユーザーを追加
                </button>
              </div>

              <div className="space-y-4">
                {users.map((user, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">ユーザー {index + 1}</h3>
                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUser(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="form-label">メールアドレス *</label>
                        <input
                          type="email"
                          value={user.email}
                          onChange={(e) => updateUser(index, 'email', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">名前 *</label>
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => updateUser(index, 'name', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">パスワード *</label>
                        <input
                          type="password"
                          value={user.password}
                          onChange={(e) => updateUser(index, 'password', e.target.value)}
                          className="form-input"
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">ロール</label>
                        <select
                          value={user.role}
                          onChange={(e) => updateUser(index, 'role', e.target.value)}
                          className="form-select"
                        >
                          <option value="USER">ユーザー</option>
                          <option value="ADMIN">管理者</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label">グループ</label>
                        <select
                          value={user.groupId || ''}
                          onChange={(e) => updateUser(index, 'groupId', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="form-select"
                        >
                          <option value="">グループなし</option>
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>
                              {group.name} ({group.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? '作成中...' : `${users.length}人のユーザーを作成`}
                </button>
                <Link href="/admin/users" className="btn-secondary">
                  キャンセル
                </Link>
              </div>
            </form>
          </div>
        )}
      </main>
    </AuthGuard>
  )
}