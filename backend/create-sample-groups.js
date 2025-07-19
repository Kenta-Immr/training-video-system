const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createSampleGroups() {
  try {
    const sampleGroups = [
      {
        name: 'ITチーム',
        description: 'システム開発・インフラ担当者'
      },
      {
        name: '営業チーム',
        description: '営業・セールス担当者'
      },
      {
        name: '人事チーム',
        description: '人事・総務担当者'
      }
    ]
    
    for (const groupData of sampleGroups) {
      const group = await prisma.group.create({
        data: groupData
      })
      
      console.log(`グループ「${group.name}」を作成しました（ID: ${group.id}）`)
    }
    
    console.log('すべてのサンプルグループを作成しました！')
    console.log('\n管理者画面でグループコード（グループ名）を使用して、')
    console.log('受講生が自己登録時にグループに参加できます。')
    console.log('\nグループコード例:')
    console.log('- ITチーム')
    console.log('- 営業チーム') 
    console.log('- 人事チーム')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleGroups()