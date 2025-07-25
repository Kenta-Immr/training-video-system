// Supabase用データストア
const { createClient } = require('@supabase/supabase-js')

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase環境変数が設定されていません - フォールバックモードで動作します')
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// =====================================================
// ユーザー関連の操作
// =====================================================

async function getUsersAsync() {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // JSONファイル形式に変換
    return data.map(user => ({
      id: user.id,
      userId: user.user_id,
      name: user.name,
      password: user.password,
      role: user.role,
      groupId: user.group_id,
      isFirstLogin: user.is_first_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }))
  } catch (error) {
    console.error('Supabaseユーザー取得エラー:', error)
    throw error
  }
}

async function getUserByUserIdAsync(userId) {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    
    if (!data) return null
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      password: data.password,
      role: data.role,
      groupId: data.group_id,
      isFirstLogin: data.is_first_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Supabaseユーザー検索エラー:', error)
    throw error
  }
}

async function createUserAsync(userData) {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: userData.userId,
        name: userData.name,
        password: userData.password,
        role: userData.role || 'USER',
        group_id: userData.groupId,
        is_first_login: userData.isFirstLogin !== false
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      password: data.password,
      role: data.role,
      groupId: data.group_id,
      isFirstLogin: data.is_first_login,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Supabaseユーザー作成エラー:', error)
    throw error
  }
}

// =====================================================
// グループ関連の操作
// =====================================================

async function getGroupsAsync() {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return data.map(group => ({
      id: group.id,
      name: group.name,
      code: group.code,
      description: group.description,
      createdAt: group.created_at,
      updatedAt: group.updated_at
    }))
  } catch (error) {
    console.error('Supabaseグループ取得エラー:', error)
    throw error
  }
}

// =====================================================
// コース関連の操作
// =====================================================

async function getCoursesAsync() {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        curriculums (
          *,
          videos (*)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (coursesError) throw coursesError
    
    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnail_url,
      curriculums: course.curriculums.map(curriculum => ({
        id: curriculum.id,
        title: curriculum.title,
        description: curriculum.description,
        courseId: curriculum.course_id,
        videos: curriculum.videos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          videoUrl: video.video_url,
          curriculumId: video.curriculum_id,
          duration: video.duration,
          uploadedFile: video.uploaded_file,
          createdAt: video.created_at,
          updatedAt: video.updated_at
        })),
        createdAt: curriculum.created_at,
        updatedAt: curriculum.updated_at
      })),
      createdAt: course.created_at,
      updatedAt: course.updated_at
    }))
  } catch (error) {
    console.error('Supabaseコース取得エラー:', error)
    throw error
  }
}

async function createVideoSupabase(videoData) {
  if (!supabase) {
    throw new Error('Supabaseが初期化されていません')
  }
  
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: videoData.title,
        description: videoData.description || '',
        video_url: videoData.videoUrl,
        curriculum_id: videoData.curriculumId,
        duration: videoData.duration || 0,
        uploaded_file: videoData.uploadedFile || false
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      videoUrl: data.video_url,
      curriculumId: data.curriculum_id,
      duration: data.duration,
      uploadedFile: data.uploaded_file,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Supabase動画作成エラー:', error)
    throw error
  }
}

// =====================================================
// 接続チェック
// =====================================================

async function checkSupabaseConnection() {
  if (!supabase) {
    return {
      connected: false,
      error: 'Supabase未初期化'
    }
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    return {
      connected: !error,
      error: error?.message
    }
  } catch (error) {
    return {
      connected: false,
      error: error.message
    }
  }
}

module.exports = {
  supabase,
  getUsersAsync,
  getUserByUserIdAsync,
  createUserAsync,
  getGroupsAsync,
  getCoursesAsync,
  createVideoSupabase,
  checkSupabaseConnection
}