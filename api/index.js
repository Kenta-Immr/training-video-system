// Vercel Serverless Function for API
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running on Vercel',
    timestamp: new Date().toISOString() 
  })
})

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
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
})

// Mock courses endpoint
app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "ウェブ開発入門",
        description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        curriculums: [
          {
            id: 1,
            title: "HTML基礎",
            description: "HTMLの基本構文と要素",
            courseId: 1,
            videos: [
              { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
              { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 }
            ]
          }
        ]
      },
      {
        id: 2,
        title: "データベース設計",
        description: "SQL、NoSQLの基礎とデータベース設計の実践的な学習",
        thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
        curriculums: [
          {
            id: 2,
            title: "SQL基礎",
            description: "SQLの基本構文",
            courseId: 2,
            videos: [
              { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
              { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 }
            ]
          }
        ]
      }
    ]
  })
})

// Handle all other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.path} not found`
  })
})

// Export for Vercel
module.exports = app