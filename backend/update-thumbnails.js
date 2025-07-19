const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateThumbnails() {
  try {
    // すべてのコースを取得
    const courses = await prisma.course.findMany()
    
    console.log(`${courses.length}個のコースが見つかりました`)
    
    // サンプル画像URLのリスト（無料のプレースホルダー画像）
    const sampleImages = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop'
    ]
    
    // 各コースにランダムなサムネイルを設定
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i]
      const imageUrl = sampleImages[i % sampleImages.length]
      
      await prisma.course.update({
        where: { id: course.id },
        data: { thumbnailUrl: imageUrl }
      })
      
      console.log(`コース「${course.title}」にサムネイルを設定しました: ${imageUrl}`)
    }
    
    console.log('すべてのコースにサムネイルを設定しました！')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateThumbnails()