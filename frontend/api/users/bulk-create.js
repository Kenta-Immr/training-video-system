export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({ error: 'ユーザーデータが無効です' });
    }

    // 模擬的な一括作成処理
    const created = [];
    const failed = [];

    users.forEach((user, index) => {
      if (!user.email || !user.name || !user.password) {
        failed.push({
          index: index + 1,
          email: user.email || '',
          error: 'メールアドレス、名前、パスワードは必須です'
        });
      } else {
        created.push({
          id: Math.floor(Math.random() * 10000),
          email: user.email,
          name: user.name,
          role: user.role || 'USER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    const result = {
      success: created.length,
      errors: failed.length,
      created,
      failed
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Bulk create users API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}