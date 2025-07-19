// Debug endpoint to test authentication
export default function handler(req, res) {
  console.log('Debug Auth - Method:', req.method)
  console.log('Debug Auth - Body:', req.body)
  console.log('Debug Auth - Headers:', req.headers)

  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    return res.json({
      success: true,
      message: 'Debug Auth endpoint is working',
      timestamp: new Date().toISOString()
    })
  }
  
  if (req.method === 'POST') {
    const { email, password } = req.body || {}
    
    console.log('Received credentials:', { email, password })
    
    // 固定テストユーザー
    if (email === 'admin@test.com' && password === 'password') {
      return res.json({
        success: true,
        token: 'test-jwt-token-' + Date.now(),
        user: {
          id: 1,
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'admin'
        }
      })
    }
    
    if (email === 'test@test.com' && password === 'test') {
      return res.json({
        success: true,
        token: 'test-jwt-token-' + Date.now(),
        user: {
          id: 2,
          email: 'test@test.com',
          name: 'Test User',
          role: 'user'
        }
      })
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      received: { email, password: password ? '***' : undefined }
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}