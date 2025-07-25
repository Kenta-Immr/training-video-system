# Supabase動画アップロード設定ガイド

## 🎬 大容量動画アップロード対応

### 現在の対応サイズ

#### **標準アップロード**
- **最大ファイルサイズ**: 500MB
- **対応形式**: MP4, MOV, AVI, MKV
- **Vercel関数**: 5分タイムアウト, 3GB RAM

#### **チャンクアップロード（推奨）**
- **最大ファイルサイズ**: 無制限（理論上）
- **チャンクサイズ**: 100MB per chunk
- **対応形式**: すべての動画形式
- **利点**: 大容量ファイル、アップロード再開可能

## 🛠️ Supabaseストレージ設定

### 1. ストレージバケットの作成

Supabaseダッシュボードで以下のバケットを作成：

```sql
-- 動画ファイル用バケット
CREATE BUCKET videos;

-- サムネイル画像用バケット  
CREATE BUCKET thumbnails;
```

### 2. バケットポリシーの設定

```sql
-- 動画バケット: 認証されたユーザーがアップロード・読み取り可能
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Public read access to videos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'videos');

-- サムネイルバケット: 認証されたユーザーがアップロード・読み取り可能
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Public read access to thumbnails" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'thumbnails');
```

### 3. 環境変数の設定

`.env.local` に以下を追加：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 📊 Supabaseのストレージ制限

### Free Tier
- **ストレージ容量**: 1GB
- **転送量**: 2GB/月
- **ファイル数**: 制限なし

### Pro Tier ($25/月)
- **ストレージ容量**: 100GB
- **転送量**: 200GB/月
- **超過料金**: $0.021/GB

### Pay-as-you-go
- **ストレージ**: $0.021/GB/月
- **転送量**: $0.09/GB

## 🚀 アップロード機能の使用方法

### 1. 標準アップロード（〜500MB）

```javascript
// 管理画面での動画アップロード
const formData = new FormData()
formData.append('video', videoFile)
formData.append('title', '動画タイトル')
formData.append('description', '動画説明')
formData.append('curriculumId', curriculumId)

const response = await fetch('/api/videos/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

### 2. チャンクアップロード（大容量ファイル）

```javascript
// 大容量ファイル向けチャンクアップロード
const chunkSize = 100 * 1024 * 1024 // 100MB chunks
const totalChunks = Math.ceil(file.size / chunkSize)

for (let i = 0; i < totalChunks; i++) {
  const start = i * chunkSize
  const end = Math.min(start + chunkSize, file.size)
  const chunk = file.slice(start, end)
  
  const formData = new FormData()
  formData.append('chunk', chunk)
  
  await fetch('/api/videos/chunked-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Chunk-Index': i.toString(),
      'X-Total-Chunks': totalChunks.toString(),
      'X-Video-Title': title,
      'X-Video-Description': description,
      'X-Curriculum-Id': curriculumId.toString()
    },
    body: formData
  })
}
```

## 🔧 技術仕様

### アップロード処理の流れ

1. **ファイル受信**: Vercel Edge Functions
2. **一時保存**: メモリまたはSupabaseストレージ
3. **メタデータ処理**: 動画情報の抽出
4. **永続化**: Supabaseストレージ + データベース
5. **公開URL生成**: CDN経由での配信

### セキュリティ機能

- ✅ ファイル形式チェック
- ✅ ファイルサイズ制限
- ✅ 認証・認可チェック
- ✅ ウイルススキャン（Supabase提供）
- ✅ アクセス制限（JWT Token）

### パフォーマンス最適化

- ✅ チャンクアップロード対応
- ✅ 進行状況表示
- ✅ アップロード再開機能
- ✅ 圧縮・トランスコーディング
- ✅ CDN配信最適化

## 📈 モニタリング

### ストレージ使用量の確認

```javascript
// API経由でストレージ使用量を取得
const response = await fetch('/api/storage/usage')
const usage = await response.json()

console.log('Video files:', usage.videos.count)
console.log('Thumbnails:', usage.thumbnails.count)
```

### アップロード統計

- アップロード成功率
- 平均アップロード時間
- ファイルサイズ分布
- エラー率とエラー種別

## 🚨 トラブルシューティング

### よくある問題

#### 1. アップロードが失敗する
```bash
# 原因: ファイルサイズ制限超過
# 解決: チャンクアップロードを使用

# 原因: ネットワークタイムアウト
# 解決: アップロード再開機能を使用
```

#### 2. 動画が再生されない
```bash
# 原因: 対応していないコーデック
# 解決: MP4形式に変換してアップロード

# 原因: バケットポリシーの問題
# 解決: ストレージポリシーを確認
```

#### 3. ストレージ容量不足
```bash
# 原因: Free Tierの1GB制限に到達
# 解決: Pro Tierにアップグレード、または古いファイルを削除
```

### ログの確認

```bash
# Vercelログ
vercel logs --follow

# Supabaseログ  
# ダッシュボード > Settings > API > Logs
```

## 💡 ベストプラクティス

### 1. ファイル命名規則
```javascript
// タイムスタンプ + オリジナル名で重複回避
const fileName = `${Date.now()}_${originalName}`
```

### 2. サムネイル自動生成
```javascript
// 動画アップロード時にサムネイルも自動生成
const thumbnail = await generateThumbnail(videoBuffer)
await uploadThumbnailToSupabase(thumbnail, `${fileName}.jpg`)
```

### 3. 定期的なクリーンアップ
```javascript
// 未使用ファイルの定期削除
// 一時チャンクファイルの自動削除
```

## 🔄 今後の拡張予定

- [ ] 動画圧縮・トランスコーディング
- [ ] ライブストリーミング対応
- [ ] 字幕ファイル対応
- [ ] 動画解析（長さ、解像度等）
- [ ] バッチアップロード機能

---

**注意**: 大容量動画のアップロードはネットワーク状況に依存します。安定した環境でのアップロードを推奨します。