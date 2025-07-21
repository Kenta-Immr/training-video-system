#!/usr/bin/env node

// 本番データの直接確認スクリプト
// 使用方法: node scripts/check-production-data.js

const path = require('path')
const fs = require('fs')

// プロジェクトルートに移動
process.chdir(path.join(__dirname, '..'))

// 環境変数の設定（本番環境想定）
process.env.NODE_ENV = 'production'

console.log('=== 本番データ直接確認スクリプト ===')
console.log('環境:', {
  NODE_ENV: process.env.NODE_ENV,
  KV_URL_EXISTS: !!process.env.KV_REST_API_URL,
  KV_TOKEN_EXISTS: !!process.env.KV_REST_API_TOKEN
})

async function checkProductionData() {
  try {
    // dataStoreモジュールを読み込み
    const dataStore = require('./lib/dataStore')
    const kvStore = require('./lib/kvStore')
    
    console.log('\n1. KVストレージ状態確認:')
    const kvAvailable = kvStore.isKVAvailable()
    console.log('  KV利用可能:', kvAvailable)
    
    if (kvAvailable) {
      try {
        const connectionTest = await kvStore.testKVConnection()
        console.log('  KV接続テスト:', connectionTest.success ? '成功' : '失敗')
        if (!connectionTest.success) {
          console.log('  失敗理由:', connectionTest.reason)
        }
      } catch (connError) {
        console.log('  KV接続エラー:', connError.message)
      }
    }
    
    console.log('\n2. メモリストレージ確認:')
    const memoryStorage = dataStore.memoryStorage
    console.log('  ユーザー数:', memoryStorage.users ? Object.keys(memoryStorage.users.users || {}).length : 0)
    console.log('  グループ数:', memoryStorage.groups ? Object.keys(memoryStorage.groups.groups || {}).length : 0)
    console.log('  コース数:', memoryStorage.courses ? Object.keys(memoryStorage.courses.courses || {}).length : 0)
    
    console.log('\n3. KV直接データ確認:')
    if (kvAvailable) {
      try {
        const kvUsers = await kvStore.getProductionData('users')
        const kvGroups = await kvStore.getProductionData('groups')
        const kvCourses = await kvStore.getProductionData('courses')
        
        console.log('  KVユーザー数:', kvUsers ? Object.keys(kvUsers.users || {}).length : 0)
        console.log('  KVグループ数:', kvGroups ? Object.keys(kvGroups.groups || {}).length : 0)
        console.log('  KVコース数:', kvCourses ? Object.keys(kvCourses.courses || {}).length : 0)
        
        if (kvUsers && Object.keys(kvUsers.users || {}).length > 0) {
          console.log('  KVユーザー例:', Object.values(kvUsers.users).slice(0, 3).map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role
          })))
        }
        
        if (kvGroups && Object.keys(kvGroups.groups || {}).length > 0) {
          console.log('  KVグループ例:', Object.values(kvGroups.groups).slice(0, 3).map(g => ({
            id: g.id,
            name: g.name,
            code: g.code
          })))
        }
      } catch (kvDataError) {
        console.log('  KVデータ取得エラー:', kvDataError.message)
      }
    } else {
      console.log('  KV利用不可 - データ確認をスキップ')
    }
    
    console.log('\n4. API経由データ確認:')
    try {
      const apiUsers = await dataStore.getUsersAsync()
      const apiGroups = await dataStore.getGroupsAsync()
      const apiCourses = await dataStore.getCoursesAsync()
      
      console.log('  API経由ユーザー数:', apiUsers.length)
      console.log('  API経由グループ数:', apiGroups.length)
      console.log('  API経由コース数:', apiCourses.length)
      
      if (apiUsers.length > 0) {
        console.log('  ユーザー例:', apiUsers.slice(0, 3).map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          groupId: u.groupId
        })))
      }
      
      if (apiGroups.length > 0) {
        console.log('  グループ例:', apiGroups.slice(0, 3).map(g => ({
          id: g.id,
          name: g.name,
          code: g.code
        })))
      }
      
    } catch (apiError) {
      console.log('  API経由データ取得エラー:', apiError.message)
    }
    
    console.log('\n=== 確認完了 ===')
    
  } catch (error) {
    console.error('データ確認中にエラーが発生しました:', error)
  }
}

// 非同期関数の実行
checkProductionData().then(() => {
  console.log('\nスクリプト実行完了')
  process.exit(0)
}).catch(error => {
  console.error('スクリプト実行エラー:', error)
  process.exit(1)
})