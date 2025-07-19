// Single video endpoint
export default function handler(req, res) {
  const { id } = req.query
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method === 'GET') {
    const videoId = parseInt(id)
    
    // サンプル動画データ
    const sampleVideos = {
      1: {
        id: 1,
        title: 'HTML入門',
        description: 'HTMLとは何かについて学びます',
        videoUrl: '#',
        curriculumId: 1,
        duration: 600, // 10分
        createdAt: '2023-10-01T10:00:00Z'
      },
      2: {
        id: 2,
        title: '基本タグ',
        description: 'よく使うHTMLタグについて解説します',
        videoUrl: '#',
        curriculumId: 1,
        duration: 480, // 8分
        createdAt: '2023-10-01T10:30:00Z'
      },
      3: {
        id: 3,
        title: 'SELECT文',
        description: 'SQLのSELECT文の使い方',
        videoUrl: '#',
        curriculumId: 2,
        duration: 720, // 12分
        createdAt: '2023-10-01T11:00:00Z'
      }
    }
    
    const video = sampleVideos[videoId]
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '動画が見つかりません'
      })
    }
    
    return res.json({
      success: true,
      data: video
    })
  }
  
  if (req.method === 'PUT') {
    const { title, description, videoUrl } = req.body
    
    return res.json({
      success: true,
      data: {
        id: parseInt(id),
        title,
        description,
        videoUrl,
        updatedAt: new Date().toISOString()
      }
    })
  }
  
  if (req.method === 'DELETE') {
    return res.json({
      success: true,
      message: '動画を削除しました'
    })
  }
  
  return res.status(405).json({ message: 'Method not allowed' })
}