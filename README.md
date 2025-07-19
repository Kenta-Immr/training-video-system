# 研修動画視聴ログ管理システム

## 概要
社員向けの研修動画を配信し、視聴ログを管理するWebアプリケーションです。

## 技術スタック
- **バックエンド**: Node.js, Express, TypeScript, Prisma
- **フロントエンド**: Next.js, React, TypeScript, Tailwind CSS
- **データベース**: PostgreSQL

## セットアップ手順

### 1. 依存関係のインストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

### 2. 環境変数の設定

```bash
# バックエンド
cd backend
cp .env.example .env
# .envファイルを編集してデータベース接続情報とJWT秘密鍵を設定

# フロントエンド
cd ../frontend
cp .env.local.example .env.local
```

### 3. データベースのセットアップ

```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
# バックエンド（ターミナル1）
cd backend
npm run dev

# フロントエンド（ターミナル2）
cd frontend
npm run dev
```

## アクセス先
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- Prisma Studio: `npm run db:studio` でデータベース管理UI