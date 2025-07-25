// Supabase Auth対応の既存データ移行スクリプト
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
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 既存データの読み込み
function loadExistingData() {
  const dataDir = path.join(process.cwd(), 'data')
  
  const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'))
  const groups = JSON.parse(fs.readFileSync(path.join(dataDir, 'groups.json'), 'utf8'))
  const courses = JSON.parse(fs.readFileSync(path.join(dataDir, 'courses.json'), 'utf8'))
  
  return { users, groups, courses }
}

// グループデータの移行
async function migrateGroups(groupsData) {
  const groups = Object.values(groupsData.groups || {}).map(group => ({
    id: group.id,
    name: group.name,
    code: group.code,
    description: group.description || null,
    created_at: group.createdAt,
    updated_at: group.updatedAt
  }))

  if (groups.length > 0) {
    console.log(`グループを移行中... (${groups.length}件)`)
    const { error } = await supabase
      .from('groups')
      .insert(groups)
    
    if (error) throw error
    console.log('✓ グループ移行完了')
  }

  return groups
}

// ユーザーデータの移行（Supabase Auth + プロファイル）
async function migrateUsers(usersData) {
  const users = Object.values(usersData.users || {})
  
  console.log(`ユーザーを移行中... (${users.length}件)`)
  
  const migratedUsers = []
  
  for (const user of users) {
    try {
      // 1. auth.usersテーブルにユーザー作成
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: `${user.userId}@training-system.local`,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          user_id: user.userId,
          name: user.name,
          role: user.role,
          group_id: user.groupId
        }
      })

      if (authError) {
        console.error(`ユーザー作成エラー (${user.userId}):`, authError)
        continue
      }

      // 2. profilesテーブルにプロファイル作成（トリガーで自動作成されるが、追加情報を更新）
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_id: user.userId,
          name: user.name,
          role: user.role,
          group_id: user.groupId,
          is_first_login: user.isFirstLogin !== false,
          created_at: user.createdAt,
          updated_at: user.updatedAt
        })
        .eq('id', authUser.user.id)

      if (profileError) {
        console.error(`プロファイル更新エラー (${user.userId}):`, profileError)
        continue
      }

      migratedUsers.push({
        auth_id: authUser.user.id,
        user_id: user.userId,
        name: user.name,
        role: user.role
      })

      console.log(`✓ ユーザー移行完了: ${user.name} (${user.userId})`)

    } catch (error) {
      console.error(`ユーザー移行エラー (${user.userId}):`, error)
    }
  }

  console.log(`ユーザー移行完了: ${migratedUsers.length}/${users.length}件`)
  return migratedUsers
}

// コース・カリキュラム・動画の移行
async function migrateCoursesData(coursesData, migratedUsers) {
  const courses = Object.values(coursesData.courses || {})
  
  // 管理者ユーザーを取得（作成者として設定）
  const adminUser = migratedUsers.find(u => u.role === 'ADMIN')
  const createdBy = adminUser?.auth_id || null

  for (const course of courses) {
    try {
      // コース作成
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: course.id,
          title: course.title,
          description: course.description || null,
          thumbnail_url: course.thumbnailUrl || null,
          created_by: createdBy,
          created_at: course.createdAt,
          updated_at: course.updatedAt
        })
        .select()
        .single()

      if (courseError) {
        console.error(`コース作成エラー (${course.title}):`, courseError)
        continue
      }

      console.log(`✓ コース作成完了: ${course.title}`)

      // カリキュラムと動画の移行
      if (course.curriculums && course.curriculums.length > 0) {
        for (const curriculum of course.curriculums) {
          try {
            // カリキュラム作成
            const { data: newCurriculum, error: curriculumError } = await supabase
              .from('curriculums')
              .insert({
                id: curriculum.id,
                title: curriculum.title,
                description: curriculum.description || null,
                course_id: course.id,
                order_index: 0,
                created_by: createdBy,
                created_at: curriculum.createdAt || course.createdAt,
                updated_at: curriculum.updatedAt || course.updatedAt
              })
              .select()
              .single()

            if (curriculumError) {
              console.error(`カリキュラム作成エラー (${curriculum.title}):`, curriculumError)
              continue
            }

            console.log(`  ✓ カリキュラム作成完了: ${curriculum.title}`)

            // 動画の移行
            if (curriculum.videos && curriculum.videos.length > 0) {
              const videos = curriculum.videos.map(video => ({
                id: video.id,
                title: video.title,
                description: video.description || null,
                video_url: video.videoUrl,
                curriculum_id: curriculum.id,
                duration: video.duration || 0,
                uploaded_file: video.uploadedFile || false,
                created_by: createdBy,
                created_at: video.createdAt,
                updated_at: video.updatedAt
              }))

              const { error: videosError } = await supabase
                .from('videos')
                .insert(videos)

              if (videosError) {
                console.error(`動画作成エラー (カリキュラム: ${curriculum.title}):`, videosError)
              } else {
                console.log(`    ✓ 動画作成完了: ${videos.length}件`)
              }
            }

          } catch (error) {
            console.error(`カリキュラム処理エラー (${curriculum.title}):`, error)
          }
        }
      }

    } catch (error) {
      console.error(`コース処理エラー (${course.title}):`, error)
    }
  }
}

// メイン実行
async function main() {
  try {
    console.log('=== Supabase Auth対応データ移行開始 ===\\n')

    console.log('既存データを読み込み中...')
    const existingData = loadExistingData()
    
    console.log('データ数:')
    console.log(`- グループ: ${Object.keys(existingData.groups.groups || {}).length}件`)
    console.log(`- ユーザー: ${Object.keys(existingData.users.users || {}).length}件`)
    console.log(`- コース: ${Object.keys(existingData.courses.courses || {}).length}件\\n`)

    // 1. グループ移行
    await migrateGroups(existingData.groups)

    // 2. ユーザー移行（Auth + プロファイル）
    const migratedUsers = await migrateUsers(existingData.users)

    // 3. コース・カリキュラム・動画移行
    await migrateCoursesData(existingData.courses, migratedUsers)

    console.log('\\n🎉 Supabase Auth対応データ移行が完了しました！')
    console.log('\\n次のステップ:')
    console.log('1. Supabaseダッシュボードでユーザーを確認')
    console.log('2. RLSポリシーが正しく動作することを確認')
    console.log('3. フロントエンドをSupabase Authに切り替え')
    
  } catch (error) {
    console.error('❌ データ移行エラー:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}