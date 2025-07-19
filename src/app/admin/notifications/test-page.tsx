'use client'

import { useEffect } from 'react'

export default function TestNotificationsPage() {
  console.log('🧪🧪🧪 TestNotificationsPage - SIMPLE TEST PAGE 🧪🧪🧪')
  console.log('🧪 This is a test page to verify routing works')
  
  useEffect(() => {
    console.log('🧪 TestNotificationsPage mounted successfully')
    console.log('🧪 Current URL:', window.location.href)
  }, [])
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'yellow', border: '5px solid red' }}>
      <h1 style={{ fontSize: '24px', color: 'red' }}>🧪 TEST NOTIFICATIONS PAGE 🧪</h1>
      <p>If you can see this, the routing is working!</p>
      <p>Current path: {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}</p>
    </div>
  )
}