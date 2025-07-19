const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSampleCourses() {
  try {
    const sampleCourses = [
      {
        title: 'ウェブ開発入門',
        description: 'HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
      },
      {
        title: 'データベース設計',
        description: 'SQL、NoSQLの基礎とデータベース設計の実践的な学習',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop'
      },
      {
        title: 'ビジネススキル向上',
        description: 'プレゼンテーション、コミュニケーション、プロジェクト管理のスキルアップ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop'
      },
      {
        title: 'AI・機械学習基礎',
        description: 'Python を使った機械学習の基礎と実践的なデータ分析',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop'
      }
    ]
    
    for (const courseData of sampleCourses) {
      const course = await prisma.course.create({
        data: courseData
      })
      
      console.log(`コース「${course.title}」を作成しました（ID: ${course.id}）`)
    }
    
    console.log('すべてのサンプルコースを作成しました！')
  } catch (error) {
    console.error('エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleCourses()