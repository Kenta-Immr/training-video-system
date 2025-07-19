import { Router } from 'express'
import { prisma } from '../index'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = Router()

// グループ一覧取得（管理者のみ）
router.get('/', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    res.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ error: 'グループ一覧の取得に失敗しました' })
  }
})

// グループ詳細取得（管理者のみ）
router.get('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      }
    })

    if (!group) {
      return res.status(404).json({ error: 'グループが見つかりません' })
    }

    res.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    res.status(500).json({ error: 'グループ詳細の取得に失敗しました' })
  }
})

// グループ作成（管理者のみ）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, code, description } = req.body

    if (!name || !code) {
      return res.status(400).json({ error: 'グループ名とコードが必要です' })
    }

    const group = await prisma.group.create({
      data: {
        name,
        code,
        description
      }
    })

    res.status(201).json(group)
  } catch (error: any) {
    console.error('Error creating group:', error)
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('name')) {
        res.status(400).json({ error: 'このグループ名は既に使用されています' })
      } else if (error.meta?.target?.includes('code')) {
        res.status(400).json({ error: 'このグループコードは既に使用されています' })
      } else {
        res.status(400).json({ error: 'グループ名またはコードが重複しています' })
      }
    } else {
      res.status(500).json({ error: 'グループの作成に失敗しました' })
    }
  }
})

// グループ更新（管理者のみ）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const { name, code, description } = req.body

    if (!name || !code) {
      return res.status(400).json({ error: 'グループ名とコードが必要です' })
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        code,
        description
      }
    })

    res.json(group)
  } catch (error: any) {
    console.error('Error updating group:', error)
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('name')) {
        res.status(400).json({ error: 'このグループ名は既に使用されています' })
      } else if (error.meta?.target?.includes('code')) {
        res.status(400).json({ error: 'このグループコードは既に使用されています' })
      } else {
        res.status(400).json({ error: 'グループ名またはコードが重複しています' })
      }
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'グループが見つかりません' })
    } else {
      res.status(500).json({ error: 'グループの更新に失敗しました' })
    }
  }
})

// グループ削除（管理者のみ）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)

    // グループに所属するユーザーのgroupIdをnullに設定
    await prisma.user.updateMany({
      where: { groupId: groupId },
      data: { groupId: null }
    })

    // グループを削除
    await prisma.group.delete({
      where: { id: groupId }
    })

    res.status(204).send()
  } catch (error: any) {
    console.error('Error deleting group:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'グループが見つかりません' })
    } else {
      res.status(500).json({ error: 'グループの削除に失敗しました' })
    }
  }
})

// ユーザーをグループに追加（管理者のみ）
router.post('/:id/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const { userIds } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'ユーザーIDの配列が必要です' })
    }

    // ユーザーのグループを更新
    await prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        groupId: groupId
      }
    })

    res.json({ message: 'ユーザーをグループに追加しました' })
  } catch (error) {
    console.error('Error adding users to group:', error)
    res.status(500).json({ error: 'ユーザーのグループ追加に失敗しました' })
  }
})

// ユーザーをグループから削除（管理者のみ）
router.delete('/:id/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const { userIds } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'ユーザーIDの配列が必要です' })
    }

    // ユーザーのグループをnullに設定
    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        groupId: groupId
      },
      data: {
        groupId: null
      }
    })

    res.json({ message: 'ユーザーをグループから削除しました' })
  } catch (error) {
    console.error('Error removing users from group:', error)
    res.status(500).json({ error: 'ユーザーのグループ削除に失敗しました' })
  }
})

// グループのコース権限取得（管理者のみ）
router.get('/:id/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    
    const groupCourses = await prisma.groupCourse.findMany({
      where: { groupId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            createdAt: true
          }
        }
      }
    })

    res.json(groupCourses.map(gc => gc.course))
  } catch (error) {
    console.error('Error fetching group courses:', error)
    res.status(500).json({ error: 'グループのコース権限取得に失敗しました' })
  }
})

// グループにコース権限を追加（管理者のみ）
router.post('/:id/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const { courseIds } = req.body

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'コースIDの配列が必要です' })
    }

    // 既存の権限をチェックして重複を避ける
    const existingPermissions = await prisma.groupCourse.findMany({
      where: {
        groupId,
        courseId: { in: courseIds }
      }
    })

    const existingCourseIds = existingPermissions.map(p => p.courseId)
    const newCourseIds = courseIds.filter(id => !existingCourseIds.includes(id))

    if (newCourseIds.length > 0) {
      await prisma.groupCourse.createMany({
        data: newCourseIds.map(courseId => ({
          groupId,
          courseId
        }))
      })
    }

    res.json({ message: 'コース権限を追加しました', addedCount: newCourseIds.length })
  } catch (error) {
    console.error('Error adding course permissions:', error)
    res.status(500).json({ error: 'コース権限の追加に失敗しました' })
  }
})

// グループからコース権限を削除（管理者のみ）
router.delete('/:id/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const { courseIds } = req.body

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ error: 'コースIDの配列が必要です' })
    }

    await prisma.groupCourse.deleteMany({
      where: {
        groupId,
        courseId: { in: courseIds }
      }
    })

    res.json({ message: 'コース権限を削除しました' })
  } catch (error) {
    console.error('Error removing course permissions:', error)
    res.status(500).json({ error: 'コース権限の削除に失敗しました' })
  }
})

// グループ進捗レポート取得（管理者 or 同じグループのユーザー）
router.get('/:id/progress', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const userId = req.user.id
    const userRole = req.user.role

    // アクセス権限チェック
    if (userRole !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      if (!user || user.groupId !== groupId) {
        return res.status(403).json({ error: 'このグループの進捗を確認する権限がありません' })
      }
    }

    // グループのユーザー一覧と進捗情報を取得
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isFirstLogin: true,
            lastLoginAt: true,
            createdAt: true,
            viewingLogs: {
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
              }
            }
          }
        },
        groupCourses: {
          include: {
            course: {
              include: {
                curriculums: {
                  include: {
                    videos: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!group) {
      return res.status(404).json({ error: 'グループが見つかりません' })
    }

    // 進捗データを計算
    const progressData = group.users.map(user => {
      const totalVideos = group.groupCourses.reduce((sum, gc) => {
        return sum + gc.course.curriculums.reduce((currSum, curr) => {
          return currSum + curr.videos.length
        }, 0)
      }, 0)

      const completedVideos = user.viewingLogs.filter(log => log.isCompleted).length
      const watchedVideos = user.viewingLogs.length

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        },
        progress: {
          totalVideos,
          watchedVideos,
          completedVideos,
          completionRate: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
          watchRate: totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0
        }
      }
    })

    res.json({
      group: {
        id: group.id,
        name: group.name,
        code: group.code,
        description: group.description
      },
      courses: group.groupCourses.map(gc => gc.course),
      members: progressData
    })
  } catch (error) {
    console.error('Error fetching group progress:', error)
    res.status(500).json({ error: 'グループ進捗の取得に失敗しました' })
  }
})

// グループメンバーの進捗詳細取得（管理者 or 同じグループのユーザー）
router.get('/:id/progress/:userId', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id)
    const targetUserId = parseInt(req.params.userId)
    const currentUserId = req.user.id
    const userRole = req.user.role

    // アクセス権限チェック
    if (userRole !== 'ADMIN') {
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId }
      })
      if (!currentUser || currentUser.groupId !== groupId) {
        return res.status(403).json({ error: 'このグループの進捗を確認する権限がありません' })
      }
    }

    // 対象ユーザーの詳細進捗を取得
    const userProgress = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        group: true,
        viewingLogs: {
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
        }
      }
    })

    if (!userProgress || userProgress.groupId !== groupId) {
      return res.status(404).json({ error: 'ユーザーが見つからないか、グループが異なります' })
    }

    res.json(userProgress)
  } catch (error) {
    console.error('Error fetching user progress:', error)
    res.status(500).json({ error: 'ユーザー進捗の取得に失敗しました' })
  }
})

export default router