# Vercel KV 確実セットアップガイド

## 方法1: ブラウザから直接
1. https://vercel.com/dashboard/stores にアクセス
2. 「Create Database」→「KV」を選択
3. 名前: `training-video-kv`
4. 「Create」をクリック

## 方法2: Vercel CLIから
```bash
# Vercel CLIをインストール
npm i -g vercel

# ログイン
vercel login

# プロジェクトにリンク
vercel link

# KVデータベース作成
vercel env pull .env.local
```

## 方法3: 直接URL
https://vercel.com/new/clone?repository-url=https://github.com/vercel/examples/tree/main/storage/kv-redis

## 環境変数の確認
KV作成後、以下が自動設定される：
- KV_REST_API_URL
- KV_REST_API_TOKEN

## トラブルシューティング
1. ブラウザのキャッシュクリア
2. 別のブラウザで試行
3. プライベートモードで試行