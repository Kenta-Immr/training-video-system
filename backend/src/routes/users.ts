import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../index'
import { authenticateToken, requireAdmin } from '../middleware/auth'

const router = Router()

// 現在のユーザー情報取得（認証されたユーザー）
router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupId: true,
        isFirstLogin: true,
        lastLoginAt: true,
        group: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error fetching current user:', error)
    res.status(500).json({ error: '現在のユーザー情報の取得に失敗しました' })
  }
})

// ユーザー一覧取得（管理者のみ）
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'ユーザー一覧の取得に失敗しました' })
  }
})

// ユーザー詳細取得（管理者のみ）
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
    })

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'ユーザー詳細の取得に失敗しました' })
  }
})

// ユーザー作成（管理者のみ）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, name, password, role, groupId } = req.body

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'メールアドレス、名前、パスワードが必要です' })
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' })
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'USER',
        groupId: groupId ? parseInt(groupId) : null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'ユーザーの作成に失敗しました' })
  }
})

// ユーザー更新（管理者のみ）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { email, name, role, password, groupId } = req.body

    if (!email || !name) {
      return res.status(400).json({ error: 'メールアドレスと名前が必要です' })
    }

    // メールアドレスの重複チェック（他のユーザーとの重複）
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: {
          not: userId
        }
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'このメールアドレスは既に使用されています' })
    }

    const updateData: any = {
      email,
      name,
      role: role || 'USER',
      groupId: groupId ? parseInt(groupId) : null
    }

    // パスワードが提供された場合のみ更新
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true,
        updatedAt: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'ユーザーの更新に失敗しました' })
  }
})

// ユーザー削除（管理者のみ）
router.delete('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.id)

    // 自分自身を削除することを防ぐ
    if (userId === req.user.id) {
      return res.status(400).json({ error: '自分自身を削除することはできません' })
    }

    // 関連する視聴ログも削除
    await prisma.viewingLog.deleteMany({
      where: { userId }
    })

    await prisma.user.delete({
      where: { id: userId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'ユーザーの削除に失敗しました' })
  }
})

// パスワードリセット（管理者のみ）
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { newPassword } = req.body

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'パスワードは4文字以上で入力してください' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isFirstLogin: true // パスワードリセット時は初回ログインフラグをONに
      }
    })

    res.json({ message: 'パスワードが正常にリセットされました' })
  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({ error: 'パスワードのリセットに失敗しました' })
  }
})

// 一括ユーザー作成（管理者のみ）
router.post('/bulk-create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { users } = req.body

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'ユーザーデータが必要です' })
    }

    const results = []
    const errors = []

    // グループ名からグループIDへのマッピングキャッシュ
    const groupCache = new Map<string, number>()

    for (let i = 0; i < users.length; i++) {
      const userData = users[i]
      const { email, name, password, role, groupId, groupName } = userData
      
      console.log(`処理中ユーザー ${i + 1}:`, { email, groupId, groupName })

      try {
        // バリデーション
        if (!email || !name || !password) {
          errors.push({
            index: i + 1,
            email: email || '',
            error: 'メールアドレス、名前、パスワードが必要です'
          })
          continue
        }

        // メールアドレスの重複チェック
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          errors.push({
            index: i + 1,
            email,
            error: 'このメールアドレスは既に使用されています'
          })
          continue
        }

        // グループの検証・作成
        let validGroupId = null
        
        // groupNameが指定されている場合（優先）
        if (groupName && groupName.trim()) {
          const trimmedGroupName = groupName.trim()
          
          // キャッシュから確認
          if (groupCache.has(trimmedGroupName)) {
            validGroupId = groupCache.get(trimmedGroupName)!
          } else {
            // 既存グループを検索
            let group = await prisma.group.findFirst({
              where: { name: trimmedGroupName }
            })
            
            // 存在しない場合は新規作成
            if (!group) {
              try {
                // グループコードを生成（グループ名から）
                const groupCode = trimmedGroupName
                  .replace(/[^\w\s]/g, '') // 特殊文字を削除
                  .replace(/\s+/g, '_') // スペースをアンダースコアに
                  .toUpperCase()
                  .substring(0, 20) // 最大20文字
                
                // コードの重複を避けるため、番号を付加する場合がある
                let finalGroupCode = groupCode
                let counter = 1
                while (await prisma.group.findUnique({ where: { code: finalGroupCode } })) {
                  finalGroupCode = `${groupCode}_${counter}`
                  counter++
                }
                
                group = await prisma.group.create({
                  data: {
                    name: trimmedGroupName,
                    code: finalGroupCode,
                    description: `CSV一括作成により自動生成されたグループ`
                  }
                })
                
                console.log(`新しいグループを作成しました: ${trimmedGroupName} (${finalGroupCode})`)
              } catch (groupError) {
                errors.push({
                  index: i + 1,
                  email,
                  error: `グループ「${trimmedGroupName}」の作成に失敗しました`
                })
                continue
              }
            }
            
            validGroupId = group.id
            groupCache.set(trimmedGroupName, validGroupId)
          }
        }
        // groupIdが指定されている場合（従来の方式）
        else if (groupId) {
          const group = await prisma.group.findUnique({
            where: { id: parseInt(groupId) }
          })
          if (group) {
            validGroupId = parseInt(groupId)
          } else {
            errors.push({
              index: i + 1,
              email,
              error: '指定されたグループIDが見つかりません'
            })
            continue
          }
        }

        // パスワードのハッシュ化
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role: role || 'USER',
            groupId: validGroupId,
            isFirstLogin: true
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            groupId: true,
            group: {
              select: {
                id: true,
                name: true
              }
            },
            createdAt: true
          }
        })

        results.push(user)
      } catch (error) {
        console.error(`Error creating user ${i + 1}:`, error)
        errors.push({
          index: i + 1,
          email: email || '',
          error: 'ユーザーの作成に失敗しました'
        })
      }
    }

    res.status(201).json({
      success: results.length,
      errors: errors.length,
      created: results,
      failed: errors
    })
  } catch (error) {
    console.error('Error in bulk user creation:', error)
    res.status(500).json({ error: '一括ユーザー作成に失敗しました' })
  }
})

// 未ログインユーザー一覧取得（管理者のみ）
router.get('/reports/first-login-pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isFirstLogin: true,
        lastLoginAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        groupId: true,
        group: {
          select: {
            id: true,
            name: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json(users)
  } catch (error) {
    console.error('Error fetching first login pending users:', error)
    res.status(500).json({ error: '初回ログイン未完了ユーザーの取得に失敗しました' })
  }
})

export default router