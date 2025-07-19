// 簡易的なコースデータ（本来はデータベースから取得）
const courses = [
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
  },
  {
    id: 3,
    title: "ビジネススキル向上",
    description: "プレゼンテーション、コミュニケーション、プロジェクト管理のスキルアップ",
    thumbnailUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop",
    curriculums: [
      {
        id: 3,
        title: "プレゼンテーション",
        description: "効果的な資料作成と発表技術",
        courseId: 3,
        videos: [
          { id: 5, title: "資料作成のコツ", description: "見やすい資料の作り方", videoUrl: "#", curriculumId: 3 }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "AI・機械学習基礎",
    description: "Pythonを使った機械学習の基礎と実践的なデータ分析",
    thumbnailUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    curriculums: [
      {
        id: 4,
        title: "Python基礎",
        description: "Pythonプログラミングの基本",
        courseId: 4,
        videos: [
          { id: 6, title: "Python入門", description: "Pythonの基本構文", videoUrl: "#", curriculumId: 4 }
        ]
      }
    ]
  }
];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  const courseId = parseInt(id);

  try {
    switch (req.method) {
      case 'GET':
        // 特定のコース取得
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
          return res.status(404).json({ error: 'コースが見つかりません' });
        }

        return res.status(200).json(course);

      case 'PUT':
        // コース更新
        const courseIndex = courses.findIndex(c => c.id === courseId);
        
        if (courseIndex === -1) {
          return res.status(404).json({ error: 'コースが見つかりません' });
        }

        const { title, description, thumbnailUrl } = req.body;
        
        if (title) courses[courseIndex].title = title;
        if (description !== undefined) courses[courseIndex].description = description;
        if (thumbnailUrl !== undefined) courses[courseIndex].thumbnailUrl = thumbnailUrl;

        return res.status(200).json(courses[courseIndex]);

      case 'DELETE':
        // コース削除
        const deleteIndex = courses.findIndex(c => c.id === courseId);
        
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'コースが見つかりません' });
        }

        courses.splice(deleteIndex, 1);
        return res.status(200).json({ message: 'コースを削除しました' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Course API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}