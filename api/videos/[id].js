// 簡易的な動画データ（本来はデータベースから取得）
const videos = [
  { id: 1, title: "HTML入門", description: "HTMLとは何か", videoUrl: "#", curriculumId: 1 },
  { id: 2, title: "基本タグ", description: "よく使うHTMLタグ", videoUrl: "#", curriculumId: 1 },
  { id: 3, title: "SELECT文", description: "データの抽出", videoUrl: "#", curriculumId: 2 },
  { id: 4, title: "INSERT文", description: "データの挿入", videoUrl: "#", curriculumId: 2 },
  { id: 5, title: "資料作成のコツ", description: "見やすい資料の作り方", videoUrl: "#", curriculumId: 3 },
  { id: 6, title: "Python入門", description: "Pythonの基本構文", videoUrl: "#", curriculumId: 4 }
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
  const videoId = parseInt(id);

  try {
    switch (req.method) {
      case 'GET':
        // 特定の動画取得
        const video = videos.find(v => v.id === videoId);
        
        if (!video) {
          return res.status(404).json({ error: '動画が見つかりません' });
        }

        return res.status(200).json(video);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Video API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}