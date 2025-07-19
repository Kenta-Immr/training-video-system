const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isFirstLogin: true,
        lastLoginAt: true,
        createdAt: true
      }
    })
    
    console.log('=== データベース内のユーザー ===')
    console.log(`総ユーザー数: ${users.length}`)
    
    if (users.length === 0) {
      console.log('ユーザーが見つかりません。管理者ユーザーを作成してください。')
    } else {
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role} - 初回ログイン: ${user.isFirstLogin}`)
      })
    }
  } catch (error) {
    console.error('データベース接続エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()