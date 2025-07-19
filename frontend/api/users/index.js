// 簡易的なユーザーデータ（本来はデータベースから取得）
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    name: '管理者',
    role: 'ADMIN',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'user@example.com',
    name: 'ユーザー',
    role: 'USER',
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
        // 全ユーザー取得
        return res.status(200).json(users);

      case 'POST':
        // 新しいユーザー作成
        const { email, name, password, role } = req.body;
        
        if (!email || !name || !password) {
          return res.status(400).json({ error: 'メールアドレス、名前、パスワードは必須です' });
        }

        const newUser = {
          id: users.length + 1,
          email,
          name,
          role: role || 'USER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        users.push(newUser);
        return res.status(201).json(newUser);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}