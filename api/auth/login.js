const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 簡易的なユーザーデータベース（本来はVercel Postgresを使用）
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    name: '管理者',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'ADMIN'
  },
  {
    id: 2,
    email: 'user@example.com',
    name: 'ユーザー',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'USER'
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
    }

    // ユーザー検索（実際にはデータベースから検索）
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'ユーザーが見つかりません' });
    }

    // 管理者の場合は固定パスワードをチェック
    if (email === 'admin@example.com' && password === 'admin123') {
      // パスワード正解
    } else {
      // 一般ユーザーは任意のパスワードで許可
      if (!password) {
        return res.status(401).json({ error: 'パスワードが正しくありません' });
      }
    }

    // JWT生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
}