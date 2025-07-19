import { Router } from 'express'
import { prisma } from '../index'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = Router()

// 視聴ログ記録/更新
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { videoId, watchedSeconds, isCompleted } = req.body
    const userId = req.user.id

    if (!videoId || watchedSeconds === undefined) {
      return res.status(400).json({ error: '動画IDと視聴秒数が必要です' })
    }

    // 既存のログを確認
    const existingLog = await prisma.viewingLog.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId: parseInt(videoId)
        }
      }
    })

    let viewingLog

    if (existingLog) {
      // 既存ログの更新（より多い視聴時間で更新）
      viewingLog = await prisma.viewingLog.update({
        where: {
          userId_videoId: {
            userId,
            videoId: parseInt(videoId)
          }
        },
        data: {
          watchedSeconds: Math.max(existingLog.watchedSeconds, parseInt(watchedSeconds)),
          isCompleted: isCompleted || existingLog.isCompleted,
          lastWatchedAt: new Date()
        }
      })
    } else {
      // 新規ログ作成
      viewingLog = await prisma.viewingLog.create({
        data: {
          userId,
          videoId: parseInt(videoId),
          watchedSeconds: parseInt(watchedSeconds),
          isCompleted: isCompleted || false,
          lastWatchedAt: new Date()
        }
      })
    }

    res.json(viewingLog)
  } catch (error) {
    console.error('Error saving viewing log:', error)
    res.status(500).json({ error: '視聴ログの保存に失敗しました' })
  }
})

// ユーザー別視聴ログ取得（管理者のみ）
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    
    const logs = await prisma.viewingLog.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            curriculum: {
              include: {
                course: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        lastWatchedAt: 'desc'
      }
    })

    res.json(logs)
  } catch (error) {
    console.error('Error fetching user logs:', error)
    res.status(500).json({ error: 'ユーザー視聴ログの取得に失敗しました' })
  }
})

// 動画別視聴ログ取得（管理者のみ）
router.get('/videos/:videoId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId)
    
    const logs = await prisma.viewingLog.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        video: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        lastWatchedAt: 'desc'
      }
    })

    res.json(logs)
  } catch (error) {
    console.error('Error fetching video logs:', error)
    res.status(500).json({ error: '動画視聴ログの取得に失敗しました' })
  }
})

// 全体統計取得（管理者のみ）
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // ユーザー別統計
    const userStats = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        groupId: true,
        viewingLogs: {
          select: {
            isCompleted: true,
            watchedSeconds: true
          }
        }
      }
    })

    // 全動画数を取得
    const totalVideos = await prisma.video.count()

    // ユーザー別進捗率を計算
    const userProgressStats = userStats.map(user => {
      const completedVideos = user.viewingLogs.filter(log => log.isCompleted).length
      const totalWatchedSeconds = user.viewingLogs.reduce((sum, log) => sum + log.watchedSeconds, 0)
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        groupId: user.groupId,
        completedVideos,
        totalVideos,
        progressRate: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
        totalWatchedSeconds
      }
    })

    res.json({
      userStats: userProgressStats,
      totalUsers: userStats.length,
      totalVideos
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: '統計データの取得に失敗しました' })
  }
})

// 自分の視聴ログ取得（受講者）
router.get('/my-logs', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id
    
    const logs = await prisma.viewingLog.findMany({
      where: { userId },
      include: {
        video: {
          include: {
            curriculum: {
              include: {
                course: true
              }
            }
          }
        }
      },
      orderBy: {
        lastWatchedAt: 'desc'
      }
    })

    res.json(logs)
  } catch (error) {
    console.error('Error fetching my logs:', error)
    res.status(500).json({ error: '視聴ログの取得に失敗しました' })
  }
})

export default router