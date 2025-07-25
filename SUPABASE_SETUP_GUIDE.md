# Supabase セットアップガイド

## 🎯 概要

このガイドでは、Training Video SystemをSupabaseデータベースで動作させるための設定手順を説明します。これまでKVストレージを使用していましたが、Supabaseに完全移行しました。

## 📋 前提条件

- Supabaseアカウント（無料プランでも可）
- プロジェクトが作成済み
- Supabase URL と API Key を取得済み

## 🛠️ セットアップ手順

### 1. Supabaseプロジェクトの設定

1. [Supabase Dashboard](https://app.supabase.com) にログイン
2. 新しいプロジェクトを作成（既存のものを使用する場合はスキップ）
3. プロジェクトのURLとAPIキーをメモ

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下を追加：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. データベーススキーマの作成

Supabase Dashboard の SQL Editor で以下のファイルを実行：

```sql
-- supabase/schema.sql の内容をコピー＆ペースト
```

または、提供された `supabase/schema.sql` ファイルを使用してください。

### 4. ストレージバケットの作成

Supabase Dashboard の Storage セクションで以下のバケットを作成：

- `videos` - 動画ファイル用
- `thumbnails` - サムネイル画像用

### 5. RLS (行レベルセキュリティ) の設定

開発環境では、テーブルのRLSを無効にするか、以下のポリシーを追加：

```sql
-- 全ユーザーに読み取り権限を付与
CREATE POLICY "Allow public read" ON courses FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read" ON curriculums FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read" ON videos FOR SELECT TO public USING (true);

-- 認証されたユーザーに全権限を付与
CREATE POLICY "Allow all for authenticated users" ON users FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON groups FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON courses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON curriculums FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON videos FOR ALL TO authenticated USING (true);
```

## 🚀 データ初期化

### 自動初期化（推奨）

1. アプリケーションを起動
2. `/system-debug` ページにアクセス
3. "データ初期化実行" ボタンをクリック

### 手動初期化

API呼び出しで初期化：

```bash
curl -X POST http://localhost:3000/api/system/production-init \
  -H "Content-Type: application/json"
```

## 📊 データ構造

### テーブル構造

- **users** - ユーザー情報
- **groups** - グループ情報
- **courses** - コース情報
- **curriculums** - カリキュラム情報
- **videos** - 動画情報
- **progress** - 学習進捗
- **logs** - ログ情報

### 主要なリレーション

```
courses (1) ←→ (n) curriculums (1) ←→ (n) videos
users (1) ←→ (n) progress ←→ (1) videos
users (1) ←→ (n) logs
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. 接続エラー
```
Error: Invalid API key
```

**解決方法:**
- 環境変数が正しく設定されているか確認
- APIキーが有効期限内か確認

#### 2. テーブルが見つからない
```
Error: relation "courses" does not exist
```

**解決方法:**
- `supabase/schema.sql` が正しく実行されているか確認
- テーブル名が正しいか確認

#### 3. データが取得できない
```
Error: Row Level Security policy violation
```

**解決方法:**
- RLS ポリシーを確認
- 認証状態を確認

### デバッグ方法

1. **ログ確認**
   - Vercel Functions のログ
   - Supabase Dashboard のログ

2. **接続テスト**
   ```javascript
   // ブラウザのコンソールで実行
   const { supabase } = await import('./lib/supabase.js')
   const { data, error } = await supabase.from('courses').select('*')
   console.log({ data, error })
   ```

## 📈 パフォーマンス最適化

### インデックス

以下のインデックスが自動作成されます：

- `idx_videos_curriculum_id` - 動画のカリキュラムID検索用
- `idx_curriculums_course_id` - カリキュラムのコースID検索用
- `idx_progress_user_id` - 進捗のユーザーID検索用

### クエリ最適化

- 必要なフィールドのみを SELECT
- 適切な WHERE 句でフィルタリング
- JOINクエリの最適化

## 🔄 マイグレーション情報

### KVストレージからの移行

以前のKVストレージベースのシステムから完全にSupabaseに移行しました：

- ✅ dataStore を supabaseDataStore に変更
- ✅ 全APIエンドポイントを更新
- ✅ フィールドマッピングを実装
- ✅ 初期化システムを更新

### データ形式の違い

| 項目 | KV形式 | Supabase形式 |
|------|--------|--------------|
| タイムスタンプ | createdAt | created_at |
| サムネイル | thumbnailUrl | thumbnail_url |
| 動画URL | videoUrl | video_url |
| カリキュラムID | curriculumId | curriculum_id |

## 🎉 完了確認

セットアップが完了したら：

1. ✅ アプリケーションの起動
2. ✅ コース一覧の表示
3. ✅ 動画の再生
4. ✅ 管理機能の動作

## 📞 サポート

問題が発生した場合：

1. 上記のトラブルシューティングを確認
2. Supabase Dashboard でログを確認
3. 環境変数の設定を再確認
4. スキーマファイルの再実行を試行

---

**注意:** このガイドは開発環境用です。本番環境では適切なセキュリティ設定を行ってください。