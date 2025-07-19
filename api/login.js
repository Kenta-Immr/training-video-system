// Login endpoint for Vercel
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body
  
  console.log('Login attempt:', { email, password })
  
  // Mock authentication with multiple test users
  const testUsers = [
    { email: 'admin@test.com', password: 'password', role: 'admin', name: 'Admin User' },
    { email: 'admin@example.com', password: 'admin', role: 'admin', name: 'Admin' },
    { email: 'user@test.com', password: 'password', role: 'user', name: 'Test User' },
    { email: 'test@test.com', password: 'test', role: 'user', name: 'Test User' }
  ]
  
  const user = testUsers.find(u => u.email === email && u.password === password)
  
  if (user) {
    res.json({
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.mock-jwt-token',
      user: {
        id: 1,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } else {
    res.status(401).json({
      message: 'Invalid email or password'
    })
  }
}