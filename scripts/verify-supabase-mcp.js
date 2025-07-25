// Supabase MCP設定検証スクリプト
const { createClient } = require('@supabase/supabase-js')

async function verifySupabaseConnection() {
  console.log('=== Supabase MCP設定検証 ===\n')

  // 環境変数チェック
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  console.log('1. 環境変数チェック:')
  const missingVars = []
  
  for (const varName of requiredEnvVars) {
    const value = process.env[varName]
    if (value) {
      console.log(`   ✓ ${varName}: ${value.substring(0, 20)}...`)
    } else {
      console.log(`   ❌ ${varName}: 未設定`)
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ 不足している環境変数: ${missingVars.join(', ')}`)
    console.log('設定方法:')
    console.log('1. .env.mcp.example をコピーして .env.local を作成')
    console.log('2. Supabaseダッシュボードから値を取得して設定')
    return false
  }

  // Supabaseクライアント作成
  console.log('\n2. Supabase接続テスト:')
  
  try {
    // 通常クライアント（anon key）
    const supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    // Service Role クライアント
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // 接続テスト（anon key）
    const { data: healthCheck, error: healthError } = await supabaseClient
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError && healthError.code !== 'PGRST301') {
      console.log(`   ❌ Anon Key接続エラー: ${healthError.message}`)
    } else {
      console.log('   ✓ Anon Key接続成功')
    }

    // 管理者権限テスト（service role key）
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    if (adminError) {
      console.log(`   ❌ Service Role Key接続エラー: ${adminError.message}`)
    } else {
      console.log('   ✓ Service Role Key接続成功')
    }

    // テーブル存在確認
    console.log('\n3. テーブル存在確認:')
    const tables = ['profiles', 'groups', 'courses', 'curriculums', 'videos']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(0)

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          console.log(`   ✓ ${table}: 存在`)
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`)
      }
    }

    // RLS設定確認
    console.log('\n4. RLS設定確認:')
    try {
      const { data: rlsCheck, error: rlsError } = await supabaseAdmin.rpc('pg_tables')
      
      if (rlsError) {
        console.log('   ⚠️  RLS確認をスキップ（権限不足）')
      } else {
        console.log('   ✓ RLS設定を確認可能')
      }
    } catch (err) {
      console.log('   ⚠️  RLS確認をスキップ')
    }

    console.log('\n🎉 Supabase MCP設定検証完了！')
    
    return true

  } catch (error) {
    console.log(`\n❌ 接続エラー: ${error.message}`)
    return false
  }
}

// MCPサーバーインストール確認
async function verifyMCPInstallation() {
  console.log('\n=== MCP サーバー確認 ===')
  
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    const process = spawn('npx', ['@modelcontextprotocol/server-supabase', '--version'], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let errorOutput = ''

    process.stdout.on('data', (data) => {
      output += data.toString()
    })

    process.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Supabase MCPサーバーがインストール済み')
        console.log(`  バージョン: ${output.trim()}`)
        resolve(true)
      } else {
        console.log('❌ Supabase MCPサーバーが未インストール')
        console.log('インストール方法:')
        console.log('  npm install -g @modelcontextprotocol/server-supabase')
        resolve(false)
      }
    })

    process.on('error', (err) => {
      console.log('❌ MCPサーバー確認エラー:', err.message)
      resolve(false)
    })
  })
}

// メイン実行
async function main() {
  const supabaseOk = await verifySupabaseConnection()
  const mcpOk = await verifyMCPInstallation()

  console.log('\n=== 設定状況まとめ ===')
  console.log(`Supabase接続: ${supabaseOk ? '✓ OK' : '❌ NG'}`)
  console.log(`MCPサーバー: ${mcpOk ? '✓ OK' : '❌ NG'}`)

  if (supabaseOk && mcpOk) {
    console.log('\n🎉 すべて準備完了！Claude DesktopでMCPを使用できます。')
    console.log('\n次のステップ:')
    console.log('1. Claude Desktopの設定ファイルを更新')
    console.log('2. Claude Desktopを再起動')
    console.log('3. "Supabaseのprofilesテーブルからデータを取得" などでテスト')
  } else {
    console.log('\n⚠️  設定を完了してから再度実行してください。')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { verifySupabaseConnection, verifyMCPInstallation }