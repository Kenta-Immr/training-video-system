const { supabase, TABLES } = require('./supabase')

console.log('🔥 Supabase DataStore 初期化')

// Supabaseベースのデータストア実装
class SupabaseDataStore {
  constructor() {
    this.initialized = false
    this.init()
  }

  async init() {
    try {
      console.log('🔄 Supabase接続テスト...')
      const { data, error } = await supabase.from(TABLES.COURSES).select('count', { count: 'exact', head: true })
      if (error) {
        console.error('❌ Supabase接続エラー:', error)
      } else {
        console.log('✅ Supabase接続成功')
        this.initialized = true
      }
    } catch (error) {
      console.error('❌ Supabase初期化失敗:', error)
    }
  }

  isKVAvailable() {
    return false // Supabaseを使用するため、常にfalse
  }

  // === コース関連 ===
  async getCourse(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .select(`
          *,
          curriculums (
            *,
            videos (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // フィールドマッピングして返す
      return {
        ...data,
        thumbnailUrl: data.thumbnail_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        curriculums: data.curriculums?.map(curriculum => ({
          ...curriculum,
          courseId: curriculum.course_id,
          createdAt: curriculum.created_at,
          updatedAt: curriculum.updated_at,
          videos: curriculum.videos?.map(video => ({
            ...video,
            videoUrl: video.video_url,
            curriculumId: video.curriculum_id,
            createdAt: video.created_at,
            updatedAt: video.updated_at
          }))
        }))
      }
    } catch (error) {
      console.error('コース取得エラー:', error)
      return null
    }
  }

  async getCourses() {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .select(`
          *,
          curriculums (
            *,
            videos (*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // 従来の形式に変換（fieldマッピング対応）
      const courses = {}
      data.forEach(course => {
        courses[course.id.toString()] = {
          ...course,
          thumbnailUrl: course.thumbnail_url,
          createdAt: course.created_at,
          updatedAt: course.updated_at,
          curriculums: course.curriculums?.map(curriculum => ({
            ...curriculum,
            courseId: curriculum.course_id,
            createdAt: curriculum.created_at,
            updatedAt: curriculum.updated_at,
            videos: curriculum.videos?.map(video => ({
              ...video,
              videoUrl: video.video_url,
              curriculumId: video.curriculum_id,
              createdAt: video.created_at,
              updatedAt: video.updated_at
            }))
          }))
        }
      })

      return {
        courses,
        nextCourseId: Math.max(...data.map(c => c.id), 0) + 1
      }
    } catch (error) {
      console.error('コース一覧取得エラー:', error)
      return { courses: {}, nextCourseId: 1 }
    }
  }

  async createCourse(courseData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .insert({
          title: courseData.title,
          description: courseData.description,
          thumbnail_url: courseData.thumbnailUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ コース作成成功:', data.title)
      return data
    } catch (error) {
      console.error('❌ コース作成エラー:', error)
      return null
    }
  }

  async updateCourse(id, courseData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.COURSES)
        .update({
          title: courseData.title,
          description: courseData.description,
          thumbnail_url: courseData.thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('コース更新エラー:', error)
      return null
    }
  }

  async deleteCourse(id) {
    try {
      const { error } = await supabase
        .from(TABLES.COURSES)
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('コース削除エラー:', error)
      return false
    }
  }

  // === 動画関連 ===
  async getVideo(id) {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEOS)
        .select(`
          *,
          curriculums (
            *,
            courses (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // フィールドマッピングして返す
      return {
        ...data,
        videoUrl: data.video_url,
        curriculumId: data.curriculum_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        curriculum: data.curriculums ? {
          ...data.curriculums,
          courseId: data.curriculums.course_id,
          createdAt: data.curriculums.created_at,
          updatedAt: data.curriculums.updated_at,
          course: data.curriculums.courses ? {
            ...data.curriculums.courses,
            thumbnailUrl: data.curriculums.courses.thumbnail_url,
            createdAt: data.curriculums.courses.created_at,
            updatedAt: data.curriculums.courses.updated_at
          } : null
        } : null
      }
    } catch (error) {
      console.error('動画取得エラー:', error)
      return null
    }
  }

  async getVideos() {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEOS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const videos = {}
      data.forEach(video => {
        videos[video.id.toString()] = video
      })

      return {
        videos,
        nextVideoId: Math.max(...data.map(v => v.id), 0) + 1
      }
    } catch (error) {
      console.error('動画一覧取得エラー:', error)
      return { videos: {}, nextVideoId: 1 }
    }
  }

  async createVideo(videoData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEOS)
        .insert({
          title: videoData.title,
          description: videoData.description,
          video_url: videoData.videoUrl,
          curriculum_id: videoData.curriculumId,
          duration: videoData.duration || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ 動画作成成功:', data.title)
      return data
    } catch (error) {
      console.error('❌ 動画作成エラー:', error)
      return null
    }
  }

  async updateVideo(id, videoData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.VIDEOS)
        .update({
          title: videoData.title,
          description: videoData.description,
          video_url: videoData.videoUrl,
          curriculum_id: videoData.curriculumId,
          duration: videoData.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('動画更新エラー:', error)
      return null
    }
  }

  async deleteVideo(id) {
    try {
      const { error } = await supabase
        .from(TABLES.VIDEOS)
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('動画削除エラー:', error)
      return false
    }
  }

  // === カリキュラム関連 ===
  async createCurriculum(curriculumData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CURRICULUMS)
        .insert({
          title: curriculumData.title,
          description: curriculumData.description,
          course_id: curriculumData.courseId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ カリキュラム作成成功:', data.title)
      return data
    } catch (error) {
      console.error('❌ カリキュラム作成エラー:', error)
      return null
    }
  }

  async updateCurriculum(id, curriculumData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CURRICULUMS)
        .update({
          title: curriculumData.title,
          description: curriculumData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('カリキュラム更新エラー:', error)
      return null
    }
  }

  async deleteCurriculum(id) {
    try {
      const { error } = await supabase
        .from(TABLES.CURRICULUMS)
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('カリキュラム削除エラー:', error)
      return false
    }
  }

  // === ユーザー関連 ===
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const users = {}
      data.forEach(user => {
        users[user.id.toString()] = user
      })

      return {
        users,
        nextUserId: Math.max(...data.map(u => u.id), 0) + 1
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error)
      return { users: {}, nextUserId: 1 }
    }
  }

  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert({
          email: userData.email,
          name: userData.name,
          role: userData.role || 'USER',
          group: userData.group,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ ユーザー作成成功:', data.name)
      return data
    } catch (error) {
      console.error('❌ ユーザー作成エラー:', error)
      return null
    }
  }

  // === グループ関連 ===
  async getGroups() {
    try {
      const { data, error } = await supabase
        .from(TABLES.GROUPS)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const groups = {}
      data.forEach(group => {
        groups[group.id.toString()] = group
      })

      return {
        groups,
        nextGroupId: Math.max(...data.map(g => g.id), 0) + 1
      }
    } catch (error) {
      console.error('グループ一覧取得エラー:', error)
      return { groups: {}, nextGroupId: 1 }
    }
  }

  async createGroup(groupData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.GROUPS)
        .insert({
          name: groupData.name,
          code: groupData.code,
          description: groupData.description,
          course_ids: groupData.courseIds || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      console.log('✅ グループ作成成功:', data.name)
      return data
    } catch (error) {
      console.error('❌ グループ作成エラー:', error)
      return null
    }
  }
}

// シングルトンインスタンス
const supabaseDataStore = new SupabaseDataStore()

module.exports = supabaseDataStore