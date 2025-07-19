import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')
  
  // 既存のデータをクリア（参照制約を考慮した順序）
  await prisma.groupCourse.deleteMany()
  await prisma.viewingLog.deleteMany()
  await prisma.video.deleteMany()
  await prisma.curriculum.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  await prisma.group.deleteMany()
  
  console.log('Existing data cleared.')
  
  // 管理者ユーザーを作成
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: '管理者',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  // サンプルグループを作成
  const group1 = await prisma.group.create({
    data: {
      name: '開発チーム',
      code: 'DEV_TEAM',
      description: '開発者向けのグループです',
    },
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'デザインチーム',
      code: 'DESIGN_TEAM',
      description: 'デザイナー向けのグループです',
    },
  })

  const group3 = await prisma.group.create({
    data: {
      name: 'マーケティングチーム',
      code: 'MKT_TEAM',
      description: 'マーケティング担当者向けのグループです',
    },
  })

  const group4 = await prisma.group.create({
    data: {
      name: 'セールスチーム',
      code: 'SALES_TEAM',
      description: '営業担当者向けのグループです',
    },
  })

  const group5 = await prisma.group.create({
    data: {
      name: '人事チーム',
      code: 'HR_TEAM',
      description: '人事担当者向けのグループです',
    },
  })

  // 開発チームのユーザーを作成
  const devUsers = [
    { email: 'yamada@example.com', name: '山田太郎', groupId: group1.id },
    { email: 'suzuki@example.com', name: '鈴木花子', groupId: group1.id },
    { email: 'tanaka@example.com', name: '田中一郎', groupId: group1.id },
    { email: 'watanabe@example.com', name: '渡辺美咲', groupId: group1.id },
  ]

  // デザインチームのユーザーを作成
  const designUsers = [
    { email: 'sato@example.com', name: '佐藤健太', groupId: group2.id },
    { email: 'kobayashi@example.com', name: '小林由美', groupId: group2.id },
    { email: 'ito@example.com', name: '伊藤拓也', groupId: group2.id },
  ]

  // マーケティングチームのユーザーを作成
  const marketingUsers = [
    { email: 'kato@example.com', name: '加藤恵', groupId: group3.id },
    { email: 'yoshida@example.com', name: '吉田翔太', groupId: group3.id },
    { email: 'matsui@example.com', name: '松井美穂', groupId: group3.id },
  ]

  // セールスチームのユーザーを作成
  const salesUsers = [
    { email: 'inoue@example.com', name: '井上雄大', groupId: group4.id },
    { email: 'nakamura@example.com', name: '中村早苗', groupId: group4.id },
  ]

  // 人事チームのユーザーを作成
  const hrUsers = [
    { email: 'kimura@example.com', name: '木村あかり', groupId: group5.id },
  ]

  // 全ユーザーを作成
  const allUsers = [...devUsers, ...designUsers, ...marketingUsers, ...salesUsers, ...hrUsers]
  for (const userData of allUsers) {
    await prisma.user.create({
      data: {
        ...userData,
        password: await bcrypt.hash('password123', 10),
        role: 'USER',
      },
    })
  }

  // 一部のユーザーを管理者に設定
  await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: '管理者田中',
      password: await bcrypt.hash('manager123', 10),
      role: 'ADMIN',
      groupId: group1.id,
    },
  })

  // サンプルコースを作成
  const course1 = await prisma.course.create({
    data: {
      title: 'プログラミング基礎コース',
      description: 'プログラミングの基礎から応用まで学ぶ総合コースです。変数、関数、オブジェクト指向プログラミングについて理解を深めます。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/007ACC/FFFFFF?text=Programming+Basics',
    },
  })

  const course2 = await prisma.course.create({
    data: {
      title: 'ウェブデザイン入門',
      description: 'ユーザー体験を重視したウェブデザインの基礎を学びます。HTML、CSS、JavaScriptを使った実践的なデザイン手法を習得します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Web+Design',
    },
  })

  const course3 = await prisma.course.create({
    data: {
      title: 'データベース設計',
      description: 'リレーショナルデータベースの設計から運用まで、実務で必要なデータベースの知識を体系的に学習します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/4ECDC4/FFFFFF?text=Database+Design',
    },
  })

  const course4 = await prisma.course.create({
    data: {
      title: 'デジタルマーケティング戦略',
      description: 'SEO、SNSマーケティング、コンテンツマーケティングなど、現代のデジタルマーケティングに必要な戦略を学びます。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/9C27B0/FFFFFF?text=Digital+Marketing',
    },
  })

  const course5 = await prisma.course.create({
    data: {
      title: 'セールススキル向上',
      description: '顧客とのコミュニケーション、提案力、クロージング技術など、営業に必要なスキルを総合的に学習します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/FF9800/FFFFFF?text=Sales+Skills',
    },
  })

  const course6 = await prisma.course.create({
    data: {
      title: '人事労務管理',
      description: '労働法の基礎、採用戦略、人事評価制度など、人事業務に必要な知識を体系的に学習します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=HR+Management',
    },
  })

  const course7 = await prisma.course.create({
    data: {
      title: 'プロジェクト管理入門',
      description: 'アジャイル開発、スクラム、リスク管理など、効果的なプロジェクト管理手法を学習します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/607D8B/FFFFFF?text=Project+Management',
    },
  })

  const course8 = await prisma.course.create({
    data: {
      title: 'データ分析基礎',
      description: 'Excel、Python、SQLを使ったデータ分析の基礎から、ビジネスに活かすデータ活用方法まで学習します。',
      thumbnailUrl: 'https://via.placeholder.com/400x300/795548/FFFFFF?text=Data+Analysis',
    },
  })

  // コース1: プログラミング基礎コース
  const curriculum1_1 = await prisma.curriculum.create({
    data: {
      title: 'プログラミング概論',
      description: 'プログラミングとは何か、基本的な概念を学びます',
      courseId: course1.id,
    },
  })

  const curriculum1_2 = await prisma.curriculum.create({
    data: {
      title: 'JavaScript基礎',
      description: 'JavaScriptの基本的な文法と使い方を学びます',
      courseId: course1.id,
    },
  })

  const curriculum1_3 = await prisma.curriculum.create({
    data: {
      title: 'オブジェクト指向プログラミング',
      description: 'クラス、オブジェクト、継承について学びます',
      courseId: course1.id,
    },
  })

  // コース1の動画
  await prisma.video.createMany({
    data: [
      { title: 'プログラミングとは', description: 'プログラミングの基本概念', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum1_1.id },
      { title: '開発環境の準備', description: 'エディタとブラウザの設定', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum1_1.id },
      { title: '変数と関数', description: 'JavaScriptの変数と関数について', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum1_2.id },
      { title: '条件分岐', description: 'if文とswitch文について', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum1_2.id },
      { title: '繰り返し処理', description: 'for文とwhile文の使い方', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum1_2.id },
      { title: 'クラスとオブジェクト', description: 'オブジェクト指向の基本', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum1_3.id },
    ]
  })

  // コース2: ウェブデザイン入門
  const curriculum2_1 = await prisma.curriculum.create({
    data: {
      title: 'HTML基礎',
      description: 'HTMLの基本タグと構造を学びます',
      courseId: course2.id,
    },
  })

  const curriculum2_2 = await prisma.curriculum.create({
    data: {
      title: 'CSS基礎',
      description: 'CSSによるスタイリングとレイアウト',
      courseId: course2.id,
    },
  })

  const curriculum2_3 = await prisma.curriculum.create({
    data: {
      title: 'レスポンシブデザイン',
      description: 'モバイル対応のウェブデザイン手法',
      courseId: course2.id,
    },
  })

  // コース2の動画
  await prisma.video.createMany({
    data: [
      { title: 'HTMLの基礎', description: 'HTMLタグの使い方', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum2_1.id },
      { title: 'セマンティックHTML', description: '意味のあるマークアップ', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum2_1.id },
      { title: 'CSSセレクタ', description: 'CSSの基本セレクタ', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum2_2.id },
      { title: 'Flexboxレイアウト', description: '柔軟なレイアウト手法', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum2_2.id },
      { title: 'Gridレイアウト', description: '格子状レイアウトの作成', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum2_2.id },
      { title: 'メディアクエリ', description: 'デバイス別のスタイル設定', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum2_3.id },
    ]
  })

  // コース3: データベース設計
  const curriculum3_1 = await prisma.curriculum.create({
    data: {
      title: 'データベース概論',
      description: 'データベースの基本概念と種類',
      courseId: course3.id,
    },
  })

  const curriculum3_2 = await prisma.curriculum.create({
    data: {
      title: 'SQL基礎',
      description: 'SQLの基本的なクエリを学びます',
      courseId: course3.id,
    },
  })

  // コース3の動画
  await prisma.video.createMany({
    data: [
      { title: 'データベースとは', description: 'データベースの基本概念', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum3_1.id },
      { title: 'リレーショナルモデル', description: 'テーブルと関係性', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum3_1.id },
      { title: 'SELECT文の基礎', description: 'データの検索方法', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum3_2.id },
      { title: 'INSERT/UPDATE/DELETE', description: 'データの操作', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum3_2.id },
    ]
  })

  // コース4: デジタルマーケティング戦略
  const curriculum4_1 = await prisma.curriculum.create({
    data: {
      title: 'マーケティング基礎',
      description: 'デジタルマーケティングの基本概念',
      courseId: course4.id,
    },
  })

  await prisma.video.createMany({
    data: [
      { title: 'デジタルマーケティング概論', description: 'デジタル時代のマーケティング', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum4_1.id },
      { title: 'SEO基礎', description: '検索エンジン最適化の基本', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum4_1.id },
      { title: 'SNSマーケティング', description: 'ソーシャルメディアを活用したマーケティング', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum4_1.id },
    ]
  })

  // コース5: セールススキル向上
  const curriculum5_1 = await prisma.curriculum.create({
    data: {
      title: '営業基礎',
      description: '営業の基本スキルとマインドセット',
      courseId: course5.id,
    },
  })

  await prisma.video.createMany({
    data: [
      { title: '営業の心構え', description: '成功する営業マンの考え方', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum5_1.id },
      { title: 'ヒアリング技術', description: '顧客ニーズの把握方法', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum5_1.id },
      { title: 'プレゼンテーション技術', description: '効果的な提案方法', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum5_1.id },
    ]
  })

  // コース6: 人事労務管理
  const curriculum6_1 = await prisma.curriculum.create({
    data: {
      title: '人事管理基礎',
      description: '人事業務の基本と法的知識',
      courseId: course6.id,
    },
  })

  await prisma.video.createMany({
    data: [
      { title: '労働法の基礎', description: '人事が知るべき労働法', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', curriculumId: curriculum6_1.id },
      { title: '採用戦略', description: '効果的な人材採用の進め方', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', curriculumId: curriculum6_1.id },
    ]
  })

  // グループ権限を設定
  await prisma.groupCourse.createMany({
    data: [
      // 開発チーム
      { groupId: group1.id, courseId: course1.id }, // プログラミング基礎
      { groupId: group1.id, courseId: course3.id }, // データベース設計
      { groupId: group1.id, courseId: course7.id }, // プロジェクト管理
      { groupId: group1.id, courseId: course8.id }, // データ分析基礎
      
      // デザインチーム
      { groupId: group2.id, courseId: course2.id }, // ウェブデザイン入門
      { groupId: group2.id, courseId: course1.id }, // プログラミング基礎（基本知識として）
      
      // マーケティングチーム
      { groupId: group3.id, courseId: course4.id }, // デジタルマーケティング戦略
      { groupId: group3.id, courseId: course8.id }, // データ分析基礎
      { groupId: group3.id, courseId: course2.id }, // ウェブデザイン入門
      
      // セールスチーム
      { groupId: group4.id, courseId: course5.id }, // セールススキル向上
      { groupId: group4.id, courseId: course4.id }, // デジタルマーケティング戦略
      
      // 人事チーム
      { groupId: group5.id, courseId: course6.id }, // 人事労務管理
      { groupId: group5.id, courseId: course7.id }, // プロジェクト管理
    ]
  })

  // 視聴ログを作成（進捗を示すため）
  const users = await prisma.user.findMany({ where: { role: 'USER' } })
  const videos = await prisma.video.findMany()
  
  // ランダムに視聴ログを作成
  for (const user of users.slice(0, 5)) { // 最初の5人のユーザーにのみ
    const userVideos = videos.slice(0, Math.floor(Math.random() * 10) + 3) // 3-12個の動画を視聴
    
    for (const video of userVideos) {
      const watchedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // 過去30日以内
      const progress = Math.floor(Math.random() * 100) + 1 // 1-100%の進捗
      const isCompleted = progress === 100 || Math.random() > 0.7 // 70%の確率で完了
      
      await prisma.viewingLog.create({
        data: {
          userId: user.id,
          videoId: video.id,
          watchedSeconds: isCompleted ? 600 : Math.floor(Math.random() * 600), // 0-600秒の視聴時間
          isCompleted: isCompleted,
          lastWatchedAt: watchedAt,
        },
      })
    }
  }

  console.log('Seed data created successfully!')
  console.log('Groups:', { group1, group2, group3, group4, group5 })
  console.log('Courses:', { course1, course2, course3, course4, course5, course6, course7, course8 })
  console.log('Total users created:', allUsers.length + 2) // +2 for admin users
  console.log('Total videos created:', videos.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })