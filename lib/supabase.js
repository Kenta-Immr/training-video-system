// Supabase設定とクライアント初期化
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase環境変数が設定されていません')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// データベーステーブル名の定数
export const TABLES = {
  USERS: 'users',
  GROUPS: 'groups', 
  COURSES: 'courses',
  CURRICULUMS: 'curriculums',
  VIDEOS: 'videos',
  PROGRESS: 'progress',
  LOGS: 'logs'
}