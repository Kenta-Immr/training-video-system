export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        // 動画作成
        const { title, description, videoUrl, curriculumId } = req.body;
        
        if (!title || !videoUrl || !curriculumId) {
          return res.status(400).json({ error: 'タイトル、動画URL、カリキュラムIDは必須です' });
        }

        const newVideo = {
          id: Date.now(), // 仮のID
          title,
          description: description || '',
          videoUrl,
          curriculumId: parseInt(curriculumId)
        };

        return res.status(201).json(newVideo);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Video API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}