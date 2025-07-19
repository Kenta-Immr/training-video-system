const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    
    // 既存の管理者をチェック
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingAdmin) {
      console.log('管理者は既に存在します:')
      console.log(`Email: ${existingAdmin.email}`)
      console.log(`Name: ${existingAdmin.name}`)
      console.log(`Role: ${existingAdmin.role}`)
      return
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    
    // 管理者ユーザーを作成
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: '管理者',
        password: hashedPassword,
        role: 'ADMIN',
        isFirstLogin: false
      }
    })
    
    console.log('✅ 管理者ユーザーを作成しました:')
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log(`👤 Name: ${admin.name}`)
    console.log(`🛡️  Role: ${admin.role}`)
    console.log('')
    console.log('⚠️  本番環境では必ずパスワードを変更してください！')
    
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()