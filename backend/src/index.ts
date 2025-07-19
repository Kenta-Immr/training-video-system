import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth'
import courseRoutes from './routes/courses'
import videoRoutes from './routes/videos'
import logRoutes from './routes/logs'
import userRoutes from './routes/users'
import groupRoutes from './routes/groups'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// Prismaクライアントの初期化
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// ミドルウェア
app.use(helmet({
  crossOriginResourcePolicy: false
}))
app.use(cors())
app.use(express.json())

// デバッグ用のリクエストロガー（ルート設定より前に配置）
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`)
  console.log('Headers:', JSON.stringify(req.headers, null, 2))
  console.log('Body:', req.body)
  next()
})

// 静的ファイル配信（アップロードされた動画）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ルート (末尾スラッシュの両方に対応)
app.use('/api/auth', authRoutes)
app.use('/api/auth/', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/courses/', courseRoutes)
app.use('/api/videos', videoRoutes)
app.use('/api/videos/', videoRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/logs/', logRoutes)
app.use('/api/users', userRoutes)
app.use('/api/users/', userRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/groups/', groupRoutes)

// 404ハンドラー
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ 
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: ['/api/auth', '/api/users', '/api/logs', '/api/courses', '/api/videos', '/api/groups', '/health']
  })
})

// Vercel Functions用のexport
export default app

// ローカル開発用
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}