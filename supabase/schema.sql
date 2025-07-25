-- Training Video System Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable RLS (Row Level Security)
-- Note: You can disable RLS for development, but enable it in production

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'INSTRUCTOR')),
  "group" VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  course_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculums table
CREATE TABLE IF NOT EXISTS curriculums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  curriculum_id INTEGER REFERENCES curriculums(id) ON DELETE CASCADE,
  duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  watched_duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_curriculum_id ON videos(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculums_course_id ON curriculums(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_video_id ON progress(video_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculums_updated_at BEFORE UPDATE ON curriculums
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for development)
-- You can remove this section in production

-- Sample users
INSERT INTO users (email, name, role, "group") VALUES 
('admin@example.com', '管理者', 'ADMIN', '管理者'),
('user@example.com', 'テストユーザー', 'USER', '一般')
ON CONFLICT (email) DO NOTHING;

-- Sample groups
INSERT INTO groups (name, code, description, course_ids) VALUES 
('管理者グループ', 'ADMIN_GROUP', 'システム管理者用のグループ', '{1,2,3}'),
('新入社員研修グループA', 'NEWBIE2024', '2024年度新入社員向けの基礎研修グループ', '{1,2}')
ON CONFLICT (code) DO NOTHING;

-- Sample courses
INSERT INTO courses (title, description, thumbnail_url) VALUES 
('ウェブ開発入門', 'HTML、CSS、JavaScriptの基礎から学ぶウェブ開発コース', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'),
('テストコース', 'テスト用のコースです', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'),
('プログラミング基礎', 'プログラミングの基本概念を学ぶコース', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop')
ON CONFLICT DO NOTHING;

-- Sample curriculums
INSERT INTO curriculums (title, description, course_id) VALUES 
('HTML基礎', 'HTMLの基本構文と要素', 1),
('基礎編', '基本的な概念を学びます', 2),
('プログラミング入門', 'プログラミングの基本的な考え方', 3)
ON CONFLICT DO NOTHING;

-- Sample videos
INSERT INTO videos (title, description, video_url, curriculum_id, duration) VALUES 
('HTML入門', 'HTMLとは何か', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1, 596),
('基本タグ', 'よく使うHTMLタグ', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 1, 653),
('概要説明', 'コースの概要について', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 2, 15),
('プログラミングとは', 'プログラミングの基本概念', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 3, 15),
('変数と演算', '変数の使い方と計算', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 3, 15)
ON CONFLICT DO NOTHING;

-- RLS policies (enable these in production for security)
-- For development, you can disable RLS or make policies more permissive

-- Enable RLS on all tables
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies (customize based on your security requirements)
-- Example: Allow all operations for authenticated users (development)
-- CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON groups FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON courses FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON curriculums FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON videos FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON progress FOR ALL TO authenticated USING (true);
-- CREATE POLICY "Allow all for authenticated users" ON logs FOR ALL TO authenticated USING (true);

-- Allow public read access to courses, curriculums, and videos (for non-authenticated users)
-- CREATE POLICY "Allow public read" ON courses FOR SELECT TO public USING (true);
-- CREATE POLICY "Allow public read" ON curriculums FOR SELECT TO public USING (true);
-- CREATE POLICY "Allow public read" ON videos FOR SELECT TO public USING (true);