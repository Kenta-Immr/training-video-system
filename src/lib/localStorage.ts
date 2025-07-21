// ブラウザのローカルストレージを使った緊急時データバックアップ
interface BackupData {
  timestamp: number
  courses: any[]
  users: any[]
  groups: any[]
}

const BACKUP_KEYS = {
  COURSES: 'training_backup_courses',
  USERS: 'training_backup_users', 
  GROUPS: 'training_backup_groups',
  LAST_SYNC: 'training_last_sync'
}

export class LocalStorageBackup {
  // データをローカルストレージに保存
  static saveToLocal(type: 'courses' | 'users' | 'groups', data: any[]) {
    if (typeof window === 'undefined') return false
    
    try {
      const backup: BackupData = {
        timestamp: Date.now(),
        courses: type === 'courses' ? data : this.getFromLocal('courses'),
        users: type === 'users' ? data : this.getFromLocal('users'),
        groups: type === 'groups' ? data : this.getFromLocal('groups')
      }
      
      localStorage.setItem(BACKUP_KEYS[type.toUpperCase() as keyof typeof BACKUP_KEYS], JSON.stringify(data))
      localStorage.setItem(BACKUP_KEYS.LAST_SYNC, Date.now().toString())
      
      console.log(`ローカルストレージに${type}データを保存:`, data.length, '件')
      return true
    } catch (error) {
      console.error('ローカルストレージ保存エラー:', error)
      return false
    }
  }

  // ローカルストレージからデータを取得
  static getFromLocal(type: 'courses' | 'users' | 'groups'): any[] {
    if (typeof window === 'undefined') return []
    
    try {
      const key = BACKUP_KEYS[type.toUpperCase() as keyof typeof BACKUP_KEYS]
      const stored = localStorage.getItem(key)
      if (!stored) return []
      
      const data = JSON.parse(stored)
      console.log(`ローカルストレージから${type}データを取得:`, data.length, '件')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('ローカルストレージ取得エラー:', error)
      return []
    }
  }

  // 最後の同期時刻を取得
  static getLastSyncTime(): number {
    if (typeof window === 'undefined') return 0
    
    try {
      const lastSync = localStorage.getItem(BACKUP_KEYS.LAST_SYNC)
      return lastSync ? parseInt(lastSync, 10) : 0
    } catch (error) {
      console.error('最終同期時刻取得エラー:', error)
      return 0
    }
  }

  // バックアップの完全性をチェック
  static checkBackupIntegrity(): boolean {
    const courses = this.getFromLocal('courses')
    const users = this.getFromLocal('users')
    const groups = this.getFromLocal('groups')
    const lastSync = this.getLastSyncTime()
    
    const isValid = courses.length >= 0 && users.length >= 0 && groups.length >= 0 && lastSync > 0
    console.log('バックアップ完全性チェック:', {
      courses: courses.length,
      users: users.length,
      groups: groups.length,
      lastSync: new Date(lastSync).toLocaleString(),
      isValid
    })
    
    return isValid
  }

  // 緊急時にローカルストレージからデータを復元
  static restoreFromLocal() {
    return {
      courses: this.getFromLocal('courses'),
      users: this.getFromLocal('users'),
      groups: this.getFromLocal('groups'),
      lastSync: this.getLastSyncTime()
    }
  }

  // ストレージをクリア
  static clearBackup() {
    if (typeof window === 'undefined') return
    
    Object.values(BACKUP_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('ローカルストレージバックアップをクリアしました')
  }
}