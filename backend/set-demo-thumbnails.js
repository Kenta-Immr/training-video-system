const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setDemoThumbnails() {
  try {
    const updates = [
      {
        id: 5,
        thumbnailUrl: 'https://picsum.photos/400/300?random=1'
      },
      {
        id: 6,
        thumbnailUrl: 'https://picsum.photos/400/300?random=2'
      },
      {
        id: 7,
        thumbnailUrl: 'https://picsum.photos/400/300?random=3'
      },
      {
        id: 8,
        thumbnailUrl: 'https://picsum.photos/400/300?random=4'
      },
      {
        id: 9,
        thumbnailUrl: 'https://picsum.photos/400/300?random=5'
      },
      {
        id: 10,
        thumbnailUrl: 'https://picsum.photos/400/300?random=6'
      },
      {
        id: 11,
        thumbnailUrl: 'https://picsum.photos/400/300?random=7'
      },
      {
        id: 12,
        thumbnailUrl: 'https://picsum.photos/400/300?random=8'
      }
    ]

    console.log('=== デモ用サムネイルを設定中 ===')
    
    for (const update of updates) {
      await prisma.course.update({
        where: { id: update.id },
        data: { thumbnailUrl: update.thumbnailUrl }
      })
      console.log(`コースID ${update.id} のサムネイルを更新しました`)
    }
    
    console.log('\n=== 更新完了 ===')
    
    // 更新後の確認
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        thumbnailUrl: true
      }
    })
    
    console.log('\n=== 更新後のコース一覧 ===')
    courses.forEach(course => {
      console.log(`${course.id}: ${course.title}`)
      console.log(`   サムネイル: ${course.thumbnailUrl}`)
    })
    
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setDemoThumbnails()