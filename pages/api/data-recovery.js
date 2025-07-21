// 起動時データ確認・復旧機能
const { kv } = require('@vercel/kv')

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  
  try {
    console.log('システム起動時データ確認開始...')
    
    // KV内の全データを確認
    const dataKeys = ['users', 'groups', 'courses', 'data_backup']
    const dataStatus = {}
    
    for (const key of dataKeys) {
      try {
        const data = await kv.get(key)
        if (key === 'data_backup') {
          dataStatus[key] = data ? {
            exists: true,
            timestamp: data.timestamp,
            counts: data.counts
          } : { exists: false }
        } else {
          const items = data?.users || data?.groups || data?.courses || data || []
          dataStatus[key] = {
            exists: !!data,
            count: Array.isArray(items) ? items.length : Object.keys(items).length,
            lastUpdated: data?.lastUpdated || 'unknown'
          }
        }
      } catch (error) {
        dataStatus[key] = { 
          exists: false, 
          error: error.message 
        }
      }
    }
    
    // KV環境変数確認
    const kvConfig = {
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN,
      environment: process.env.NODE_ENV
    }
    
    console.log('データ確認結果:', { dataStatus, kvConfig })
    
    // 警告チェック
    const warnings = []
    if (!kvConfig.hasKVUrl || !kvConfig.hasKVToken) {
      warnings.push('KV環境変数が設定されていません')
    }
    
    if (!dataStatus.users?.exists) {
      warnings.push('ユーザーデータが見つかりません')
    }
    
    if (!dataStatus.groups?.exists) {
      warnings.push('グループデータが見つかりません')
    }
    
    return res.json({
      success: true,
      message: 'データ確認完了',
      timestamp: new Date().toISOString(),
      kvConfig,
      dataStatus,
      warnings,
      recommendations: warnings.length > 0 ? [
        'バックアップからの復元を検討してください',
        '/api/backup-data でバックアップを確認できます'
      ] : ['データは正常に保存されています']
    })
    
  } catch (error) {
    console.error('データ確認エラー:', error)
    return res.status(500).json({
      success: false,
      message: 'データ確認に失敗しました',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}