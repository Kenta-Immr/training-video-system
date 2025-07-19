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
    // 模擬的なサムネイルアップロード
    // 実際の実装では、ファイルをVercel Blob等にアップロードする
    
    const thumbnailUrl = `https://images.unsplash.com/photo-${Date.now()}?w=400&h=300&fit=crop`;
    
    return res.status(200).json({ thumbnailUrl });

  } catch (error) {
    console.error('Upload thumbnail API error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
}