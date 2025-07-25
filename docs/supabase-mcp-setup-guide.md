# Supabase MCPサーバー設定ガイド

## 必要な情報一覧

### 1. Supabaseプロジェクト情報
以下の情報をSupabaseダッシュボードから取得してください：

#### プロジェクト基本情報
- **プロジェクトURL**: `https://your-project-id.supabase.co`
- **Project ID**: `your-project-id`
- **API Keys**:
  - `anon public` key
  - `service_role` key (秘密鍵)

#### データベース情報
- **Database Password**: プロジェクト作成時に設定したパスワード
- **Database URL**: `postgresql://postgres:[PASSWORD]@db.your-project-id.supabase.co:5432/postgres`

### 2. 取得手順

#### Step 1: Supabaseダッシュボードにアクセス
1. https://supabase.com/dashboard にアクセス
2. 対象プロジェクトを選択

#### Step 2: API設定の確認
1. 左サイドバーの `Settings` → `API` をクリック
2. 以下の情報をコピー：
   ```
   Project URL: https://your-project-id.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

#### Step 3: データベース接続情報の確認
1. 左サイドバーの `Settings` → `Database` をクリック
2. `Connection string` セクションで以下を確認：
   ```
   URI: postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
   ```

### 3. Claude Desktop設定

Claude Desktopの設定ファイルに以下を追加：

#### macOS の場合
ファイル場所: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://your-project-id.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

#### Windows の場合
ファイル場所: `%APPDATA%\\Claude\\claude_desktop_config.json`

### 4. 設定確認コマンド

MCPサーバーがインストールされているか確認：
```bash
npx @modelcontextprotocol/server-supabase --version
```

インストールされていない場合：
```bash
npm install -g @modelcontextprotocol/server-supabase
```

### 5. テスト用クエリ例

設定完了後、Claude Desktopで以下をテスト：

```
以下のSupabaseテーブルからデータを取得してください：
- profiles テーブルの全レコード
- groups テーブルの全レコード
```

### 6. トラブルシューティング

#### 接続エラーの場合
1. **API Keys確認**: anon keyとservice role keyが正しいか
2. **URL確認**: プロジェクトURLが正しいか
3. **RLS設定**: Row Level Securityの設定が適切か

#### 権限エラーの場合
1. Service Role Keyを使用しているか確認
2. RLSポリシーでアクセスが許可されているか確認

### 7. セキュリティ注意事項

⚠️ **重要**: Service Role Keyは強力な権限を持ちます
- 本番環境では適切なアクセス制御を実装
- 環境変数で管理し、コードに直接記述しない
- 定期的にキーのローテーションを実施

## 現在必要な作業

以下の情報を提供してください：

1. **Supabaseプロジェクトは作成済みですか？**
   - Yes → プロジェクトURL、API Keys、Database Passwordを教えてください
   - No → プロジェクト作成から始めましょう

2. **Claude Desktopは使用していますか？**
   - Yes → 設定ファイルの場所を確認します
   - No → どのクライアントでMCPを使用予定ですか？

3. **データベーススキーマは設定済みですか？**
   - Yes → そのまま進められます
   - No → まずスキーマ設定から始めましょう

この情報をお聞かせください。設定手順を具体的にガイドします。