// Groups management endpoint
export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    // グループ一覧を返す
    return res.json({
      success: true,
      data: [
        {
          id: 1,
          name: '開発部',
          code: 'DEV001',
          description: 'ソフトウェア開発チーム',
          createdAt: '2023-10-01T10:00:00Z',
          updatedAt: '2023-10-01T10:00:00Z',
          users: [
            { id: 3, name: '山田太郎', email: 'user1@example.com' }
          ]
        },
        {
          id: 2,
          name: '営業部',
          code: 'SALES001',
          description: '営業・マーケティングチーム',
          createdAt: '2023-10-01T10:00:00Z',
          updatedAt: '2023-10-01T10:00:00Z',
          users: [
            { id: 4, name: '佐藤花子', email: 'user2@example.com' }
          ]
        },
        {
          id: 3,
          name: '人事部',
          code: 'HR001',
          description: '人事・総務チーム',
          createdAt: '2023-10-01T10:00:00Z',
          updatedAt: '2023-10-01T10:00:00Z',
          users: []
        }
      ]
    })
  }
  
  if (req.method === 'POST') {
    const { name, code, description } = req.body
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'グループ名とコードは必須です'
      })
    }
    
    // 新しいグループを作成（模擬）
    return res.json({
      success: true,
      data: {
        id: Date.now(),
        name,
        code,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        users: []
      }
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}