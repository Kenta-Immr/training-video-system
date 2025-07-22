// デバッグ用トークンチェックAPI
export default function handler(req, res) {
  const authHeader = req.headers.authorization
  
  console.log('🔍 デバッグトークンAPI呼び出し')
  console.log('Authorization header:', authHeader)
  console.log('All headers:', req.headers)
  
  const result = {
    hasAuthHeader: !!authHeader,
    authHeader: authHeader,
    startsWithBearer: authHeader?.startsWith('Bearer '),
    token: authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null,
    tokenLength: authHeader?.startsWith('Bearer ') ? authHeader.substring(7).length : null,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
  
  return res.json({
    success: true,
    data: result,
    message: 'Token debug information'
  })
}