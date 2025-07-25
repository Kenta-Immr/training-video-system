// Supabase Storage utilities for video upload
const { createClient } = require('@supabase/supabase-js')

// サーバーサイドでのSupabaseクライアント（Service Role Key使用）
let supabaseAdmin = null

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    console.log('✅ Supabase Admin client initialized for storage')
  } else {
    console.log('⚠️ Supabase credentials not found, storage features disabled')
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase Admin client:', error)
}

// ストレージバケット名
const VIDEO_BUCKET = 'videos'
const THUMBNAIL_BUCKET = 'thumbnails'

/**
 * Supabaseストレージに動画ファイルをアップロード
 * @param {Buffer} fileBuffer - アップロードするファイルのバッファ
 * @param {string} fileName - ファイル名
 * @param {string} contentType - MIMEタイプ
 * @returns {Promise<Object>} アップロード結果
 */
async function uploadVideoToSupabase(fileBuffer, fileName, contentType = 'video/mp4') {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized')
  }

  try {
    console.log(`Starting video upload: ${fileName} (${fileBuffer.length} bytes)`)

    // ファイル名にタイムスタンプを追加してユニークにする
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${fileName}`
    const filePath = `uploads/${uniqueFileName}`

    // Supabaseストレージにアップロード
    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // 公開URLを取得
    const { data: urlData } = supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(filePath)

    console.log(`✅ Video uploaded successfully: ${filePath}`)

    return {
      success: true,
      path: filePath,
      publicUrl: urlData.publicUrl,
      fileName: uniqueFileName,
      size: fileBuffer.length
    }

  } catch (error) {
    console.error('Video upload error:', error)
    throw error
  }
}

/**
 * サムネイル画像をSupabaseストレージにアップロード
 * @param {Buffer} imageBuffer - アップロードする画像のバッファ
 * @param {string} fileName - ファイル名
 * @param {string} contentType - MIMEタイプ
 * @returns {Promise<Object>} アップロード結果
 */
async function uploadThumbnailToSupabase(imageBuffer, fileName, contentType = 'image/jpeg') {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized')
  }

  try {
    console.log(`Starting thumbnail upload: ${fileName} (${imageBuffer.length} bytes)`)

    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${fileName}`
    const filePath = `thumbnails/${uniqueFileName}`

    const { data, error } = await supabaseAdmin.storage
      .from(THUMBNAIL_BUCKET)
      .upload(filePath, imageBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase thumbnail upload error:', error)
      throw new Error(`Thumbnail upload failed: ${error.message}`)
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(THUMBNAIL_BUCKET)
      .getPublicUrl(filePath)

    console.log(`✅ Thumbnail uploaded successfully: ${filePath}`)

    return {
      success: true,
      path: filePath,
      publicUrl: urlData.publicUrl,
      fileName: uniqueFileName,
      size: imageBuffer.length
    }

  } catch (error) {
    console.error('Thumbnail upload error:', error)
    throw error
  }
}

/**
 * チャンクファイルをSupabaseストレージにアップロード
 * @param {Buffer} chunkBuffer - チャンクのバッファ
 * @param {string} chunkId - チャンクID
 * @param {number} chunkIndex - チャンクインデックス
 * @returns {Promise<Object>} アップロード結果
 */
async function uploadChunkToSupabase(chunkBuffer, chunkId, chunkIndex) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized')
  }

  try {
    const chunkPath = `chunks/${chunkId}/${chunkIndex.toString().padStart(4, '0')}.chunk`

    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .upload(chunkPath, chunkBuffer, {
        contentType: 'application/octet-stream',
        cacheControl: '300', // 5分でキャッシュ期限切れ
        upsert: true
      })

    if (error) {
      throw new Error(`Chunk upload failed: ${error.message}`)
    }

    return {
      success: true,
      path: chunkPath,
      chunkIndex,
      size: chunkBuffer.length
    }

  } catch (error) {
    console.error(`Chunk ${chunkIndex} upload error:`, error)
    throw error
  }
}

/**
 * チャンクを結合して最終的な動画ファイルを作成
 * @param {string} chunkId - チャンクID
 * @param {number} totalChunks - 総チャンク数
 * @param {string} finalFileName - 最終ファイル名
 * @returns {Promise<Object>} 結合結果
 */
async function mergeChunksInSupabase(chunkId, totalChunks, finalFileName) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not initialized')
  }

  try {
    console.log(`Merging ${totalChunks} chunks for ${chunkId}`)

    // すべてのチャンクをダウンロード
    const chunks = []
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `chunks/${chunkId}/${i.toString().padStart(4, '0')}.chunk`
      
      const { data, error } = await supabaseAdmin.storage
        .from(VIDEO_BUCKET)
        .download(chunkPath)

      if (error) {
        throw new Error(`Failed to download chunk ${i}: ${error.message}`)
      }

      const buffer = Buffer.from(await data.arrayBuffer())
      chunks.push(buffer)
    }

    // チャンクを結合
    const mergedBuffer = Buffer.concat(chunks)
    console.log(`Merged video size: ${mergedBuffer.length} bytes`)

    // 結合されたファイルをアップロード
    const uploadResult = await uploadVideoToSupabase(
      mergedBuffer, 
      finalFileName, 
      'video/mp4'
    )

    // チャンクファイルを削除（クリーンアップ）
    const deletePromises = []
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `chunks/${chunkId}/${i.toString().padStart(4, '0')}.chunk`
      deletePromises.push(
        supabaseAdmin.storage.from(VIDEO_BUCKET).remove([chunkPath])
      )
    }

    await Promise.allSettled(deletePromises)
    console.log(`✅ Cleaned up ${totalChunks} chunk files`)

    return uploadResult

  } catch (error) {
    console.error('Chunk merge error:', error)
    throw error
  }
}

/**
 * ストレージの使用量を取得
 * @returns {Promise<Object>} ストレージ使用量情報
 */
async function getStorageUsage() {
  if (!supabaseAdmin) {
    return { error: 'Supabase Admin client not initialized' }
  }

  try {
    // Note: Supabaseの現在のAPIでは直接的な使用量取得は制限されているため、
    // ファイル一覧から推計する
    const { data: videoFiles, error: videoError } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .list('uploads', { limit: 1000 })

    const { data: thumbnailFiles, error: thumbnailError } = await supabaseAdmin.storage
      .from(THUMBNAIL_BUCKET)
      .list('thumbnails', { limit: 1000 })

    if (videoError || thumbnailError) {
      throw new Error('Failed to get storage usage')
    }

    const videoCount = videoFiles?.length || 0
    const thumbnailCount = thumbnailFiles?.length || 0

    return {
      success: true,
      videos: {
        count: videoCount,
        bucket: VIDEO_BUCKET
      },
      thumbnails: {
        count: thumbnailCount,
        bucket: THUMBNAIL_BUCKET
      }
    }

  } catch (error) {
    console.error('Storage usage error:', error)
    return { error: error.message }
  }
}

/**
 * Supabaseストレージが利用可能かチェック
 * @returns {boolean} 利用可能かどうか
 */
function isSupabaseStorageAvailable() {
  return !!supabaseAdmin
}

module.exports = {
  uploadVideoToSupabase,
  uploadThumbnailToSupabase,
  uploadChunkToSupabase,
  mergeChunksInSupabase,
  getStorageUsage,
  isSupabaseStorageAvailable,
  VIDEO_BUCKET,
  THUMBNAIL_BUCKET
}