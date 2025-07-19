'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminPageWrapper from '@/components/AdminPageWrapper'
import { logAPI, courseAPI, Course, groupAPI, Group } from '@/lib/api'

interface ReportData {
  totalUsers: number
  totalVideos: number
  totalCourses: number
  totalWatchTime: number
  averageCompletion: number
  userProgress: any[]
  courseStats: any[]
  weeklyProgress: any[]
}

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchReportData()
    fetchGroups()
  }, [dateRange])

  useEffect(() => {
    fetchReportData()
  }, [selectedGroupId])

  const fetchGroups = async () => {
    try {
      const response = await groupAPI.getAll()
      console.log('Groups API response:', response.data)
      
      const groupsData = response.data?.data || response.data
      console.log('Processed groups data:', groupsData)
      
      setGroups(Array.isArray(groupsData) ? groupsData : [])
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      setGroups([])
    }
  }

  const fetchReportData = async () => {
    try {
      const [statsResponse, coursesResponse] = await Promise.all([
        logAPI.getStats(),
        courseAPI.getAll()
      ])

      console.log('Stats API response:', statsResponse.data)
      console.log('Courses API response:', coursesResponse.data)
      
      const stats = statsResponse.data?.data || statsResponse.data
      const coursesData = coursesResponse.data?.data || coursesResponse.data
      
      console.log('Processed stats data:', stats)
      console.log('Processed courses data:', coursesData)
      
      setCourses(Array.isArray(coursesData) ? coursesData : [])

      // グループフィルターを適用
      let filteredUserStats = stats.userStats
      if (selectedGroupId !== null) {
        filteredUserStats = stats.userStats.filter(user => user.groupId === selectedGroupId)
      }

      // 週次進捗データを生成（模擬データ）
      const weeklyProgress = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i * 7)
        weeklyProgress.push({
          week: date.toISOString().split('T')[0],
          newUsers: Math.floor(Math.random() * 10) + 1,
          completedVideos: Math.floor(Math.random() * 50) + 10,
          totalWatchTime: Math.floor(Math.random() * 1000) + 500
        })
      }

      // コース別統計
      const courseStats = (Array.isArray(coursesData) ? coursesData : []).map(course => {
        const totalVideos = course.curriculums?.reduce((sum, curr) => 
          sum + (curr.videos?.length || 0), 0) || 0
        const enrolledUsers = filteredUserStats.length
        const avgCompletion = filteredUserStats.reduce((sum, user) => 
          sum + user.progressRate, 0) / filteredUserStats.length || 0

        return {
          id: course.id,
          title: course.title,
          totalVideos,
          enrolledUsers,
          avgCompletion: Math.round(avgCompletion),
          totalWatchTime: Math.floor(Math.random() * 5000) + 1000
        }
      })

      const reportData: ReportData = {
        totalUsers: filteredUserStats.length,
        totalVideos: stats.totalVideos,
        totalCourses: Array.isArray(coursesData) ? coursesData.length : 0,
        totalWatchTime: filteredUserStats.reduce((sum, user) => 
          sum + user.totalWatchedSeconds, 0),
        averageCompletion: Math.round(filteredUserStats.reduce((sum, user) => 
          sum + user.progressRate, 0) / filteredUserStats.length || 0),
        userProgress: filteredUserStats,
        courseStats,
        weeklyProgress
      }

      setReportData(reportData)
    } catch (error: any) {
      console.error('Fetch report data error:', error)
      setError(error.response?.data?.error || 'レポートデータの取得に失敗しました')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    if (!reportData) return

    const exportTime = new Date().toISOString()
    
    if (exportFormat === 'csv') {
      exportCSV()
    } else if (exportFormat === 'json') {
      exportJSON()
    } else if (exportFormat === 'pdf') {
      exportPDF()
    }
  }

  const exportCSV = () => {
    if (!reportData) return

    // ユーザー進捗データをCSV形式で出力
    const csvContent = [
      // ヘッダー
      ['ユーザー名', 'メールアドレス', '完了動画数', '総動画数', '進捗率(%)', '総視聴時間(秒)'].join(','),
      // データ行
      ...reportData.userProgress.map(user => [
        user.name,
        user.email,
        user.completedVideos,
        user.totalVideos,
        user.progressRate,
        user.totalWatchedSeconds
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `training-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportJSON = () => {
    if (!reportData) return

    const jsonData = {
      exportDate: new Date().toISOString(),
      dateRange,
      summary: {
        totalUsers: reportData.totalUsers,
        totalVideos: reportData.totalVideos,
        totalCourses: reportData.totalCourses,
        totalWatchTime: reportData.totalWatchTime,
        averageCompletion: reportData.averageCompletion
      },
      userProgress: reportData.userProgress,
      courseStats: reportData.courseStats,
      weeklyProgress: reportData.weeklyProgress
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `training-report-${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportPDF = () => {
    if (!reportData) return

    // シンプルなPDF生成（jsPDFの代替として、ブラウザの印刷機能を使用）
    const printWindow = window.open('', '_blank')
    const selectedGroupName = selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : 'すべてのグループ'
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>研修レポート</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
          .summary-card h3 { margin: 0 0 10px 0; color: #666; font-size: 14px; }
          .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .progress-bar { width: 100px; height: 10px; background-color: #eee; border-radius: 5px; overflow: hidden; }
          .progress-fill { height: 100%; background-color: #3b82f6; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>研修レポート</h1>
          <p>出力日時: ${new Date().toLocaleString('ja-JP')}</p>
          <p>対象グループ: ${selectedGroupName}</p>
          ${dateRange.startDate && dateRange.endDate ? `<p>期間: ${dateRange.startDate} ～ ${dateRange.endDate}</p>` : ''}
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <h3>総受講者数</h3>
            <div class="value">${reportData.totalUsers}</div>
          </div>
          <div class="summary-card">
            <h3>総動画数</h3>
            <div class="value">${reportData.totalVideos}</div>
          </div>
          <div class="summary-card">
            <h3>総コース数</h3>
            <div class="value">${reportData.totalCourses}</div>
          </div>
          <div class="summary-card">
            <h3>平均完了率</h3>
            <div class="value">${reportData.averageCompletion}%</div>
          </div>
        </div>

        <h2>ユーザー詳細進捗</h2>
        <table>
          <thead>
            <tr>
              <th>ユーザー名</th>
              <th>メールアドレス</th>
              <th>完了動画数</th>
              <th>進捗率</th>
              <th>総視聴時間</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.userProgress.map(user => `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.completedVideos} / ${user.totalVideos}</td>
                <td>${user.progressRate}%</td>
                <td>${formatTime(user.totalWatchedSeconds)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>コース別統計</h2>
        <table>
          <thead>
            <tr>
              <th>コース名</th>
              <th>動画数</th>
              <th>受講者数</th>
              <th>平均完了率</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.courseStats.map(course => `
              <tr>
                <td>${course.title}</td>
                <td>${course.totalVideos}本</td>
                <td>${course.enrolledUsers}人</td>
                <td>${course.avgCompletion}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `
    
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}時間${mins}分`
  }

  return (
    <AdminPageWrapper title="詳細分析・レポート" description="研修の詳細分析データとエクスポート機能">

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 期間選択とエクスポート */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">レポート設定</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="form-label">開始日</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">終了日</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">グループフィルター</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
                className="form-input"
              >
                <option value="">すべてのグループ</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">エクスポート形式</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="form-input"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportData}
                disabled={!reportData}
                className="btn-primary w-full disabled:opacity-50"
              >
                エクスポート
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reportData && (
          <>
            {/* 全体サマリー */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.totalUsers}</div>
                <div className="text-gray-600">総受講者数</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.totalVideos}</div>
                <div className="text-gray-600">総動画数</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-purple-600">{reportData.totalCourses}</div>
                <div className="text-gray-600">総コース数</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(reportData.totalWatchTime)}
                </div>
                <div className="text-gray-600">総視聴時間</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-red-600">{reportData.averageCompletion}%</div>
                <div className="text-gray-600">平均完了率</div>
              </div>
            </div>

            {/* 週次進捗チャート */}
            <div className="card mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">週次進捗</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">週</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">新規ユーザー</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">完了動画数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">視聴時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.weeklyProgress.map((week, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(week.week).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {week.newUsers}人
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {week.completedVideos}本
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(week.totalWatchTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* コース別統計 */}
            <div className="card mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">コース別統計</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">コース名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">動画数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">受講者数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均完了率</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">総視聴時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.courseStats.map((course) => (
                      <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.totalVideos}本
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.enrolledUsers}人
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${course.avgCompletion}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="font-medium">{course.avgCompletion}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(course.totalWatchTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ユーザー詳細進捗 */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">ユーザー詳細進捗</h2>
                {selectedGroupId && (
                  <span className="text-sm text-gray-600">
                    フィルター: {groups.find(g => g.id === selectedGroupId)?.name}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">完了動画</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">進捗率</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">総視聴時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.userProgress.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.completedVideos} / {user.totalVideos}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 mr-3">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${user.progressRate}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="font-medium">{user.progressRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(user.totalWatchedSeconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
    </AdminPageWrapper>
  )
}