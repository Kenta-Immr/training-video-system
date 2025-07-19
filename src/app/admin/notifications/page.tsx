'use client'

export default function NotificationsPage() {
  console.log('🔥🔥🔥 SIMPLE NOTIFICATIONS PAGE LOADING 🔥🔥🔥')
  
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '24px',
      textAlign: 'center',
      border: '10px solid yellow'
    }}>
      <h1>🔥 通知・アラートページ 🔥</h1>
      <p>これが表示されればNext.jsルーティングは動作しています</p>
      <p>現在のパス: {typeof window !== 'undefined' ? window.location.pathname : 'Loading...'}</p>
      <div style={{ marginTop: '20px', fontSize: '16px' }}>
        <p>✅ NotificationsPage コンポーネントが読み込まれました</p>
        <p>✅ /admin/notifications ルートが正常に動作しています</p>
      </div>
    </div>
  )
}