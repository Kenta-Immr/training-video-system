// 模擬的なコースデータ（実際にはデータベースから取得）
let courses = [
  {
    id: 1,
    title: "ウェブ開発入門",
    curriculums: [
      { id: 1, title: "HTML基礎", description: "HTMLの基本構文と要素", courseId: 1 }
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
      case 'POST':
        // カリキュラム作成
        const { title, description } = req.body;
        
        if (!title) {
          return res.status(400).json({ error: 'タイトルは必須です' });
        }

        const newCurriculum = {
          id: Date.now(), // 仮のID
          title,
          description: description || '',
          courseId
        };

        return res.status(201).json(newCurriculum);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Curriculum API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}