// 簡易的なグループデータ（本来はデータベースから取得）
const groups = [
  {
    id: 1,
    name: '営業部',
    code: 'SALES',
    description: '営業部門のグループ',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: '技術部',
    code: 'TECH',
    description: '技術部門のグループ',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
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

  try {
    switch (req.method) {
      case 'GET':
        // 全グループ取得
        return res.status(200).json(groups);

      case 'POST':
        // 新しいグループ作成
        const { name, code, description } = req.body;
        
        if (!name || !code) {
          return res.status(400).json({ error: '名前とコードは必須です' });
        }

        const newGroup = {
          id: groups.length + 1,
          name,
          code,
          description: description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        groups.push(newGroup);
        return res.status(201).json(newGroup);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Groups API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}