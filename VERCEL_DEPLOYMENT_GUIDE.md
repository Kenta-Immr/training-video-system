# Vercel本番環境デプロイガイド

## 🚀 デプロイ手順

### 1. Vercelプロジェクトの設定

```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# プロジェクトをVercelにデプロイ
vercel --prod
```

### 2. 必要な環境変数の設定

Vercelダッシュボードの「Settings > Environment Variables」で以下を設定：

#### データストレージ設定（必須）
```
# Vercel KV（Redis）- 本番データ永続化用
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
```

#### その他の環境変数
```
# 本番用API URL（自動設定されるが明示的に設定も可能）
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app

# Supabase設定（オプション - Supabase使用時）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Vercel KVの設定手順

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard

2. **プロジェクトを選択**
   - `training-video-system`プロジェクトをクリック

3. **Storage > KV を選択**
   - 「Create Database」をクリック
   - データベース名を入力（例：`training-video-db`）

4. **環境変数を自動設定**
   - KV作成後、「Connect」をクリック
   - 環境変数が自動的に設定されます

## 📁 本番環境でのデータ管理

### データストレージの仕組み
- **本番環境**: Vercel KV（Redis）を使用
- **開発環境**: ローカルJSONファイルを使用
- **自動フォールバック**: KVが利用できない場合はJSONファイルに切り替え

### 初期データの投入
本番環境では以下のデータが自動的に利用可能になります：

#### コース データ
1. **ウェブ開発入門** - HTML基礎（動画3本）
2. **テストコース** - 基礎編（動画1本）
3. **プログラミング基礎** - プログラミング入門（動画2本）

#### ユーザー データ
- 管理者アカウント: `admin@example.com`
- テストユーザー: `user@example.com`

## 🔧 設定済みの機能

### Vercel最適化設定
- ✅ 動的レンダリング設定
- ✅ APIタイムアウト設定（アップロード: 300秒）
- ✅ メモリ設定（アップロード: 1024MB）
- ✅ 適切なキャッシュ戦略
- ✅ 日本リージョン指定（hnd1）

### セキュリティ設定
- ✅ CORS設定
- ✅ セキュリティヘッダー
- ✅ CSP設定（必要に応じて）

## 🚨 重要な注意点

### 1. データの永続化
- **開発環境**: ローカルファイル（`data/*.json`）
- **本番環境**: Vercel KV（必須設定）
- KV未設定の場合、データが失われる可能性があります

### 2. 動画ファイル
- サンプル動画はGoogle Cloud Storageの公開URLを使用
- 本番では専用のストレージサービス推奨

### 3. 認証システム
- 現在はJWT認証を使用
- 本格運用時はSupabase Authまたは他の認証サービス推奨

## 📊 モニタリング

### ログの確認
```bash
# Vercel関数ログを確認
vercel logs

# リアルタイムログを監視
vercel logs --follow
```

### パフォーマンス
- Vercel Analyticsが自動で有効
- Core Web Vitalsを監視可能

## 🔄 デプロイ後の確認事項

1. **基本機能テスト**
   - [ ] ログイン/ログアウト
   - [ ] コース一覧表示
   - [ ] 動画再生
   - [ ] 進捗保存

2. **データ永続化テスト**
   - [ ] ユーザー登録
   - [ ] 視聴ログ保存
   - [ ] コース作成（管理者）

3. **パフォーマンステスト**
   - [ ] ページ読み込み速度
   - [ ] 動画ストリーミング
   - [ ] API応答時間

## 🆘 トラブルシューティング

### よくある問題

1. **「Internal Server Error」が発生**
   - KV環境変数が正しく設定されているか確認
   - Vercelの関数ログを確認

2. **動画が再生されない**
   - 動画URLが有効か確認
   - ネットワーク接続を確認

3. **データが保存されない**
   - KVデータベースの接続状況を確認
   - API endpointのレスポンスを確認

### サポート
問題が解決しない場合は、Vercelログとエラーメッセージを確認してください。

---

**デプロイ準備完了** ✅  
このガイドに従ってVercelにデプロイすることで、本番環境で完全に動作する研修動画システムが利用可能になります。