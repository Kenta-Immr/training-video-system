// Supabase RLS対応のユーザー取得API
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Service Role Key使用（RLSバイパス可能）
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 通常のクライアント（RLS適用）
const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 認証トークンの検証
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: '認証が必要です' })
    }

    // トークンでユーザー確認
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '無効な認証トークンです' })
    }

    // ユーザーのプロファイル取得（RLS適用）
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(403).json({ error: 'プロファイル取得に失敗しました' })
    }

    // 管理者の場合のみ全ユーザー取得
    if (profile.role === 'ADMIN') {
      // Service Role Keyで全ユーザー取得（RLSバイパス）
      const { data: allProfiles, error: allProfilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          groups (
            id,
            name,
            code
          )
        `)
        .order('created_at', { ascending: false })

      if (allProfilesError) {
        return res.status(500).json({ error: 'ユーザー取得に失敗しました' })
      }

      return res.status(200).json({
        success: true,
        data: allProfiles,
        count: allProfiles.length
      })
    }

    // 一般ユーザーは自分の情報のみ
    const { data: userProfile, error: userProfileError } = await supabaseClient
      .from('profiles')
      .select(`
        *,
        groups (
          id,
          name,
          code
        )
      `)
      .eq('id', user.id)
      .single()

    if (userProfileError) {
      return res.status(500).json({ error: 'プロファイル取得に失敗しました' })
    }

    return res.status(200).json({
      success: true,
      data: [userProfile],
      count: 1
    })

  } catch (error) {
    console.error('API エラー:', error)
    return res.status(500).json({ 
      error: 'サーバー内部エラー',
      details: error.message 
    })
  }
}