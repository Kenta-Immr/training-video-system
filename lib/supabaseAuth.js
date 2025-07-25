// Supabase公式Auth対応のクライアント設定
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません')
}

// クライアント作成（RLS自動適用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// =====================================================
// 認証関数
// =====================================================

// カスタムサインアップ（学籍番号 + パスワード）
export async function signUpWithCustomId(userIdValue, password, name, role = 'USER', groupId = null) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: `${userIdValue}@training-system.local`, // 仮想メールアドレス
      password: password,
      options: {
        data: {
          user_id: userIdValue,
          name: name,
          role: role,
          group_id: groupId
        }
      }
    })

    if (error) throw error

    return { user: data.user, error: null }
  } catch (error) {
    console.error('サインアップエラー:', error)
    return { user: null, error }
  }
}

// カスタムサインイン（学籍番号 + パスワード）
export async function signInWithCustomId(userIdValue, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${userIdValue}@training-system.local`,
      password: password
    })

    if (error) throw error

    return { user: data.user, session: data.session, error: null }
  } catch (error) {
    console.error('サインインエラー:', error)
    return { user: null, session: null, error }
  }
}

// サインアウト
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('サインアウトエラー:', error)
    return { error }
  }
}

// 現在のユーザー取得
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return { user, error: null }
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return { user: null, error }
  }
}

// 現在のユーザープロファイル取得
export async function getCurrentProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) return { profile: null, error: null }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    return { profile, error: null }
  } catch (error) {
    console.error('プロファイル取得エラー:', error)
    return { profile: null, error }
  }
}

// =====================================================
// 権限チェック関数
// =====================================================

// 管理者チェック
export async function isAdmin() {
  try {
    const { profile, error } = await getCurrentProfile()
    if (error || !profile) return false
    return profile.role === 'ADMIN'
  } catch (error) {
    console.error('管理者チェックエラー:', error)
    return false
  }
}

// インストラクターまたは管理者チェック
export async function isInstructorOrAdmin() {
  try {
    const { profile, error } = await getCurrentProfile()
    if (error || !profile) return false
    return ['ADMIN', 'INSTRUCTOR'].includes(profile.role)
  } catch (error) {
    console.error('権限チェックエラー:', error)
    return false
  }
}

// =====================================================
// 認証状態監視
// =====================================================

// 認証状態の変更を監視
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// =====================================================
// プロファイル管理
// =====================================================

// プロファイル更新
export async function updateProfile(updates) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('ユーザーが認証されていません')

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return { profile: data, error: null }
  } catch (error) {
    console.error('プロファイル更新エラー:', error)
    return { profile: null, error }
  }
}

export { supabase as default }