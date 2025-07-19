const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addGroupCodes() {
  try {
    // 既存のグループを取得
    const groups = await prisma.group.findMany()
    
    console.log(`${groups.length}個のグループが見つかりました`)
    
    for (const group of groups) {
      // グループ名をベースにしたコードを生成（大文字、スペース削除）
      const code = group.name.toUpperCase().replace(/\s+/g, '_')
      
      console.log(`グループ「${group.name}」にコード「${code}」を設定...`)
      
      // まず ALTER TABLE でコード列を追加（NULL許可）
      await prisma.$executeRaw`ALTER TABLE Group ADD COLUMN code TEXT`
      
      // 既存グループにコードを設定
      await prisma.$executeRaw`UPDATE Group SET code = ${code} WHERE id = ${group.id}`
    }
    
    console.log('グループコードの設定が完了しました')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addGroupCodes()