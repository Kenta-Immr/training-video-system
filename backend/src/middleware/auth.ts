import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../index'

interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'アクセストークンが必要です' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: '無効なトークンです' })
  }
}

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: '管理者権限が必要です' })
  }
  next()
}