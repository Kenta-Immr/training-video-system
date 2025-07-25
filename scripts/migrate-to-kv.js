#!/usr/bin/env node

/**
 * ローカルデータをVercel KVに移行するスクリプト
 * 使用方法: node scripts/migrate-to-kv.js
 */

const fs = require('fs')
const path = require('path')

// 環境変数チェック
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('❌ KV環境変数が設定されていません')
  console.log('Vercel dashboardでKVを作成し、環境変数を設定してください：')
  console.log('- KV_REST_API_URL')
  console.log('- KV_REST_API_TOKEN')
  process.exit(1)
}

const kvStore = require('../lib/kvStore')

async function migrateData() {
  try {
    console.log('🚀 KVデータ移行開始...')
    
    // KV初期化
    await kvStore.initializeKV()
    console.log('✅ KV初期化完了')
    
    const dataDir = path.join(process.cwd(), 'data')
    const files = [
      { name: 'users.json', key: 'users' },
      { name: 'groups.json', key: 'groups' },
      { name: 'courses.json', key: 'courses' },
      { name: 'logs.json', key: 'viewing_logs' },
      { name: 'instructors.json', key: 'instructors' }
    ]
    
    for (const file of files) {
      const filePath = path.join(dataDir, file.name)
      
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
          console.log(`📁 ${file.name}を読み込み: ${Object.keys(data[file.key] || {}).length}件`)
          
          // KVに保存
          await kvStore.saveProductionData(file.key, data)
          console.log(`✅ ${file.name} → KV移行完了`)
          
          // 検証
          const verifyData = await kvStore.getProductionData(file.key)
          const verifyCount = Object.keys(verifyData[file.key] || {}).length
          console.log(`🔍 検証: ${verifyCount}件確認`)
          
        } catch (error) {
          console.error(`❌ ${file.name}移行エラー:`, error.message)
        }
      } else {
        console.log(`⚠️ ${file.name}が見つかりません`)
      }
    }
    
    console.log('🎉 KVデータ移行完了！')
    
    // 移行結果確認
    console.log('\n📊 移行結果確認:')
    for (const file of files) {
      try {
        const data = await kvStore.getProductionData(file.key)
        const count = Object.keys(data[file.key] || {}).length
        console.log(`  ${file.key}: ${count}件`)
      } catch (error) {
        console.log(`  ${file.key}: エラー`)
      }
    }
    
  } catch (error) {
    console.error('❌ 移行エラー:', error)
    process.exit(1)
  }
}

// 実行
migrateData()