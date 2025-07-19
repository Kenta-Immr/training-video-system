import { Router } from 'express'
import { prisma } from '../index'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { imageUpload } from '../middleware/upload'

const router = Router()

// コース一覧取得（受講者・管理者共通）
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    let courses
    
    if (req.user.role === 'ADMIN') {
      // 管理者は全てのコースを取得
      courses = await prisma.course.findMany({
        include: {
          curriculums: {
            include: {
              videos: {
                include: {
                  viewingLogs: true
                }
              }
            }
          }
        }
      })
    } else {
      // 一般ユーザーは自分のグループに権限があるコースのみ取得
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { groupId: true }
      })

      if (!user?.groupId) {
        // グループに属していない場合は空の配列を返す
        return res.json([])
      }

      const groupCourses = await prisma.groupCourse.findMany({
        where: { groupId: user.groupId },
        include: {
          course: {
            include: {
              curriculums: {
                include: {
                  videos: {
                    include: {
                      viewingLogs: {
                        where: { userId: req.user.id }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })

      courses = groupCourses.map(gc => gc.course)
    }

    res.json(courses)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ error: 'コース一覧の取得に失敗しました' })
  }
})

// コース詳細取得
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.id)
    
    // 管理者でない場合はグループ権限をチェック
    if (req.user.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { groupId: true }
      })

      if (!user?.groupId) {
        return res.status(403).json({ error: 'このコースへのアクセス権限がありません' })
      }

      // グループにコースへのアクセス権限があるかチェック
      const groupCourse = await prisma.groupCourse.findUnique({
        where: {
          groupId_courseId: {
            groupId: user.groupId,
            courseId: courseId
          }
        }
      })

      if (!groupCourse) {
        return res.status(403).json({ error: 'このコースへのアクセス権限がありません' })
      }
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        curriculums: {
          include: {
            videos: {
              include: {
                viewingLogs: req.user.role === 'ADMIN' ? true : {
                  where: { userId: req.user.id }
                }
              }
            }
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'コースが見つかりません' })
    }

    res.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    res.status(500).json({ error: 'コース詳細の取得に失敗しました' })
  }
})

// サムネイル画像アップロード（管理者のみ）
router.post('/upload-thumbnail', authenticateToken, requireAdmin, imageUpload.single('thumbnail'), async (req: any, res) => {
  try {
    console.log('Upload request received')
    console.log('Files:', req.file)
    console.log('Body:', req.body)
    
    const file = req.file

    if (!file) {
      console.log('No file received')
      return res.status(400).json({ error: '画像ファイルが必要です' })
    }

    console.log('File uploaded successfully:', file.filename)
    
    // ファイルのURLを生成
    const thumbnailUrl = `${req.protocol}://${req.get('host')}/uploads/images/${file.filename}`
    console.log('Generated URL:', thumbnailUrl)

    res.json({ thumbnailUrl })
  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    res.status(500).json({ error: 'サムネイルのアップロードに失敗しました' })
  }
})

// コース作成（管理者のみ）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, thumbnailUrl } = req.body

    if (!title) {
      return res.status(400).json({ error: 'タイトルが必要です' })
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnailUrl
      }
    })

    res.status(201).json(course)
  } catch (error) {
    console.error('Error creating course:', error)
    res.status(500).json({ error: 'コースの作成に失敗しました' })
  }
})

// コース更新（管理者のみ）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id)
    const { title, description, thumbnailUrl } = req.body

    if (!title) {
      return res.status(400).json({ error: 'タイトルが必要です' })
    }

    const updateData: any = {
      title,
      description
    }

    // thumbnailUrlが提供された場合のみ更新
    if (thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = thumbnailUrl
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData
    })

    res.json(course)
  } catch (error) {
    console.error('Error updating course:', error)
    res.status(500).json({ error: 'コースの更新に失敗しました' })
  }
})

// コース削除（管理者のみ）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id)

    await prisma.course.delete({
      where: { id: courseId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting course:', error)
    res.status(500).json({ error: 'コースの削除に失敗しました' })
  }
})

// カリキュラム作成（管理者のみ）
router.post('/:id/curriculums', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.id)
    const { title, description } = req.body

    if (!title) {
      return res.status(400).json({ error: 'タイトルが必要です' })
    }

    const curriculum = await prisma.curriculum.create({
      data: {
        title,
        description,
        courseId
      }
    })

    res.status(201).json(curriculum)
  } catch (error) {
    console.error('Error creating curriculum:', error)
    res.status(500).json({ error: 'カリキュラムの作成に失敗しました' })
  }
})

// カリキュラム更新（管理者のみ）
router.put('/curriculums/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const curriculumId = parseInt(req.params.id)
    const { title, description } = req.body

    if (!title) {
      return res.status(400).json({ error: 'タイトルが必要です' })
    }

    const curriculum = await prisma.curriculum.update({
      where: { id: curriculumId },
      data: {
        title,
        description
      }
    })

    res.json(curriculum)
  } catch (error) {
    console.error('Error updating curriculum:', error)
    res.status(500).json({ error: 'カリキュラムの更新に失敗しました' })
  }
})

// カリキュラム削除（管理者のみ）
router.delete('/curriculums/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const curriculumId = parseInt(req.params.id)

    await prisma.curriculum.delete({
      where: { id: curriculumId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    res.status(500).json({ error: 'カリキュラムの削除に失敗しました' })
  }
})

export default router