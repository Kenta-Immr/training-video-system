// 既存データをSupabaseに移行するスクリプト
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 既存データの読み込み
function loadExistingData() {
  const dataDir = path.join(process.cwd(), 'data')
  
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))
  const groups = JSON.parse(fs.readFileSync(path.join(dataDir, 'groups.json'), 'utf8'))
  const courses = JSON.parse(fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf8'))
  
  return { users, groups, courses }
}

// データ変換関数
function transformData(data) {
  // グループデータの変換
  const groups = Object.values(data.groups.groups || {}).map(group => ({
    id: group.id,
    name: group.name,
    code: group.code,
    description: group.description || null,
    created_at: group.createdAt,
    updated_at: group.updatedAt
  }))

  // ユーザーデータの変換
  const users = Object.values(data.users.users || {}).map(user => ({
    id: user.id,
    user_id: user.userId,
    name: user.name,
    password: user.password,
    role: user.role,
    group_id: user.groupId,
    is_first_login: user.isFirstLogin !== false,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }))

  // コースデータの変換
  const courses = Object.values(data.courses.courses || {}).map(course => ({
    id: course.id,
    title: course.title,
    description: course.description || null,
    thumbnail_url: course.thumbnailUrl || null,
    created_at: course.createdAt,
    updated_at: course.updatedAt
  }))

  // カリキュラムとビデオの変換
  const curriculums = []
  const videos = []

  Object.values(data.courses.courses || {}).forEach(course => {
    if (course.curriculums) {
      course.curriculums.forEach(curriculum => {
        curriculums.push({
          id: curriculum.id,
          title: curriculum.title,
          description: curriculum.description || null,
          course_id: course.id,
          order_index: 0,
          created_at: curriculum.createdAt || course.createdAt,
          updated_at: curriculum.updatedAt || course.updatedAt
        })

        if (curriculum.videos) {
          curriculum.videos.forEach(video => {
            videos.push({
              id: video.id,
              title: video.title,
              description: video.description || null,
              video_url: video.videoUrl,
              curriculum_id: curriculum.id,
              duration: video.duration || 0,
              uploaded_file: video.uploadedFile || false,
              created_at: video.createdAt,
              updated_at: video.updatedAt
            })
          })
        }
      })
    }
  })

  return { groups, users, courses, curriculums, videos }
}

// データの挿入
async function insertData(transformedData) {
  try {
    console.log('データ移行開始...')

    // グループの挿入
    if (transformedData.groups.length > 0) {
      console.log(`グループを挿入中... (${transformedData.groups.length}件)`)
      const { error: groupsError } = await supabase
        .from('groups')
        .insert(transformedData.groups)
      
      if (groupsError) throw groupsError
      console.log('✓ グループ挿入完了')
    }

    // ユーザーの挿入
    if (transformedData.users.length > 0) {
      console.log(`ユーザーを挿入中... (${transformedData.users.length}件)`)
      const { error: usersError } = await supabase
        .from('users')
        .insert(transformedData.users)
      
      if (usersError) throw usersError
      console.log('✓ ユーザー挿入完了')
    }

    // コースの挿入
    if (transformedData.courses.length > 0) {
      console.log(`コースを挿入中... (${transformedData.courses.length}件)`)
      const { error: coursesError } = await supabase
        .from('courses')
        .insert(transformedData.courses)
      
      if (coursesError) throw coursesError
      console.log('✓ コース挿入完了')
    }

    // カリキュラムの挿入
    if (transformedData.curriculums.length > 0) {
      console.log(`カリキュラムを挿入中... (${transformedData.curriculums.length}件)`)
      const { error: curriculumsError } = await supabase
        .from('curriculums')
        .insert(transformedData.curriculums)
      
      if (curriculumsError) throw curriculumsError
      console.log('✓ カリキュラム挿入完了')
    }

    // ビデオの挿入
    if (transformedData.videos.length > 0) {
      console.log(`ビデオを挿入中... (${transformedData.videos.length}件)`)
      const { error: videosError } = await supabase
        .from('videos')
        .insert(transformedData.videos)
      
      if (videosError) throw videosError
      console.log('✓ ビデオ挿入完了')
    }

    console.log('\\n🎉 データ移行が完了しました！')
    
  } catch (error) {
    console.error('❌ データ移行エラー:', error)
    process.exit(1)
  }
}

// メイン実行
async function main() {
  try {
    console.log('既存データを読み込み中...')
    const existingData = loadExistingData()
    
    console.log('データを変換中...')
    const transformedData = transformData(existingData)
    
    console.log('変換結果:')
    console.log(`- グループ: ${transformedData.groups.length}件`)
    console.log(`- ユーザー: ${transformedData.users.length}件`)
    console.log(`- コース: ${transformedData.courses.length}件`)
    console.log(`- カリキュラム: ${transformedData.curriculums.length}件`)
    console.log(`- ビデオ: ${transformedData.videos.length}件`)
    
    await insertData(transformedData)
    
  } catch (error) {
    console.error('メイン処理エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { loadExistingData, transformData, insertData }