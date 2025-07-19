// Courses endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  res.json({
    success: true,
    data: [
      {
        id: 1,
        title: "ウェブ開発入門",
        description: "HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース",
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        curriculums: [
          {
            id: 1,
            title: "HTML基礎",
            description: "HTMLの基本構文と要素",
            courseId: 1,
            videos: [
              { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
              { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 }
            ]
          }
        ]
      },
      {
        id: 2,
        title: "データベース設計",
        description: "SQL、NoSQLの基礎とデータベース設計の実践的な学習",
        thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop",
        curriculums: [
          {
            id: 2,
            title: "SQL基礎",
            description: "SQLの基本構文",
            courseId: 2,
            videos: [
              { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
              { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 }
            ]
          }
        ]
      }
    ]
  })
}