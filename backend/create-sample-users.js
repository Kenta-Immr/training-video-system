const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSampleUsers() {
  try {
    // 管理者ユーザーを作成
    const adminEmail = 'admin@example.com'
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: '管理者',
          password: hashedAdminPassword,
          role: 'ADMIN',
          isFirstLogin: false
        }
      })
      console.log('✅ 管理者ユーザーを作成しました')
    }
    
    // 一般ユーザーを作成
    const userEmail = 'user@example.com'
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })
    
    if (!existingUser) {
      const hashedUserPassword = await bcrypt.hash('user123', 10)
      await prisma.user.create({
        data: {
          email: userEmail,
          name: '一般ユーザー',
          password: hashedUserPassword,
          role: 'USER',
          isFirstLogin: false
        }
      })
      console.log('✅ 一般ユーザーを作成しました')
    }
    
    console.log('\n📧 ログイン情報:')
    console.log('管理者: admin@example.com / admin123')
    console.log('一般ユーザー: user@example.com / user123')
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleUsers()