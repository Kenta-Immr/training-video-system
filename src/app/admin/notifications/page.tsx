'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
  const router = useRouter()
  const [currentPath, setCurrentPath] = useState('Loading...')
  
  console.log('🔥🔥🔥 SIMPLE NOTIFICATIONS PAGE LOADING 🔥🔥🔥')
  
  // SSRではwindowアクセスを避ける
  if (typeof window !== 'undefined') {
    console.log('🔥 Current window.location:', window.location)
    console.log('🔥 Current window.location.href:', window.location.href)
    console.log('🔥 Current window.location.pathname:', window.location.pathname)
  } else {
    console.log('🔥 Running on server side - window not available')
  }
  
  useEffect(() => {
    console.log('🔥 useEffect - Component mounted')
    console.log('🔥 useEffect - window.location.href:', window.location.href)
    console.log('🔥 useEffect - window.location.pathname:', window.location.pathname)
    
    // 状態を更新してハイドレーションエラーを防ぐ
    setCurrentPath(window.location.pathname)
    
    // 1秒後にもう一度確認
    setTimeout(() => {
      console.log('🔥 After 1 second - window.location.href:', window.location.href)
      console.log('🔥 After 1 second - window.location.pathname:', window.location.pathname)
      setCurrentPath(window.location.pathname)
    }, 1000)
  }, [])
  
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
      <p>現在のパス: {currentPath}</p>
      <div style={{ marginTop: '20px', fontSize: '16px' }}>
        <p>✅ NotificationsPage コンポーネントが読み込まれました</p>
        <p>✅ /admin/notifications ルートが正常に動作しています</p>
      </div>
    </div>
  )
}