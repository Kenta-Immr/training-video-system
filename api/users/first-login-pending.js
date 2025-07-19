export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 初回ログイン未完了ユーザーの模擬データ
    const pendingUsers = [];
    
    return res.status(200).json(pendingUsers);
  } catch (error) {
    console.error('First login pending API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}