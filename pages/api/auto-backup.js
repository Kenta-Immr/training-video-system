// 自動バックアップシステム
export default async function handler(req, res) {
  // この関数はVercel Cronジョブから定期実行される想定
  try {
    console.log('自動バックアップ開始:', new Date().toISOString())
    
    const { kv } = require('@vercel/kv')
    
    // 全データを取得
    let [usersData, groupsData, coursesData, videosData, logsData] = await Promise.all([
      kv.get('users'),
      kv.get('groups'),
      kv.get('courses'),
      kv.get('videos'),
      kv.get('viewing_logs')
    ])
    
    // データ整合性チェック
    const integrityCheck = {
      users: { exists: !!usersData, count: usersData?.users ? Object.keys(usersData.users).length : 0 },
      groups: { exists: !!groupsData, count: groupsData?.groups ? Object.keys(groupsData.groups).length : 0 },
      courses: { exists: !!coursesData, count: coursesData?.courses ? Object.keys(coursesData.courses).length : 0 },
      videos: { exists: !!videosData, count: videosData?.videos ? Object.keys(videosData.videos).length : 0 },
      logs: { exists: !!logsData, count: logsData?.logs ? Object.keys(logsData.logs).length : 0 }
    }
    
    // 不足データの補完
    const fixes = []
    
    // 基本グループが存在しない場合は作成
    if (!groupsData || Object.keys(groupsData.groups || {}).length === 0) {
      const defaultGroups = {
        groups: {
          '1': {
            id: 1,
            name: '管理グループ',
            code: 'ADMIN',
            description: 'システム管理者グループ',
            userIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          '2': {
            id: 2,
            name: '開発チーム',
            code: 'DEV',
            description: '開発者グループ',
            userIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          '3': {
            id: 3,
            name: '営業チーム',
            code: 'SALES',
            description: '営業担当グループ',
            userIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        nextGroupId: 4,
        lastUpdated: new Date().toISOString()
      }
      
      await kv.set('groups', defaultGroups)
      fixes.push('groups_restored')
      groupsData = defaultGroups
    }
    
    // バックアップデータを作成
    const backupData = {
      users: usersData || { users: {}, nextUserId: 1, lastUpdated: new Date().toISOString() },
      groups: groupsData,
      courses: coursesData || { courses: {}, nextCourseId: 1, lastUpdated: new Date().toISOString() },
      videos: videosData || { videos: {}, nextVideoId: 1, lastUpdated: new Date().toISOString() },
      logs: logsData || { logs: {}, nextLogId: 1, lastUpdated: new Date().toISOString() },
      backupTimestamp: new Date().toISOString(),
      integrityCheck,
      fixesApplied: fixes,
      version: '2.0'
    }
    
    // 複数のバックアップキーに保存（冗長性確保）
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const hourStr = now.getHours().toString().padStart(2, '0')
    
    const backupKeys = [
      `backup_${dateStr}`,
      `backup_${dateStr}_${hourStr}`,
      `backup_latest`,
      `backup_${dateStr}_full`
    ]
    
    // 全バックアップキーに並列保存
    await Promise.all(backupKeys.map(key => kv.set(key, backupData)))
    
    // バックアップ履歴を更新
    const backupHistory = await kv.get('backup_history') || { backups: [] }
    backupHistory.backups.unshift({
      timestamp: new Date().toISOString(),
      keys: backupKeys,
      dataSize: JSON.stringify(backupData).length,
      integrityCheck,
      fixesApplied: fixes
    })
    
    // 履歴は最新30件まで保持
    if (backupHistory.backups.length > 30) {
      backupHistory.backups = backupHistory.backups.slice(0, 30)
    }
    
    await kv.set('backup_history', backupHistory)
    
    console.log('自動バックアップ完了:', {
      keys: backupKeys,
      integrityCheck,
      fixesApplied: fixes,
      dataSize: JSON.stringify(backupData).length
    })
    
    return res.json({
      success: true,
      message: '自動バックアップ完了',
      data: {
        backupKeys,
        integrityCheck,
        fixesApplied: fixes,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('自動バックアップエラー:', error)
    return res.status(500).json({
      success: false,
      message: '自動バックアップに失敗しました',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}