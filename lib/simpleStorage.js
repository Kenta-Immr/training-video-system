// シンプルな永続化ソリューション（KV代替）
// GitHub Gistを使用した簡易データストレージ

const GITHUB_TOKEN = process.env.GITHUB_TOKEN // GitHubの個人アクセストークン
const GIST_ID = process.env.GIST_ID // 専用Gistのid

class SimpleStorage {
  async saveData(key, data) {
    if (!GITHUB_TOKEN || !GIST_ID) {
      console.warn('GitHub設定なし - メモリのみで動作')
      return false
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [`${key}.json`]: {
              content: JSON.stringify(data, null, 2)
            }
          }
        })
      })

      if (response.ok) {
        console.log(`✓ ${key} データをGistに保存成功`)
        return true
      } else {
        console.error(`✗ Gist保存失敗: ${response.statusText}`)
        return false
      }
    } catch (error) {
      console.error('Gist保存エラー:', error)
      return false
    }
  }

  async loadData(key) {
    if (!GITHUB_TOKEN || !GIST_ID) {
      console.warn('GitHub設定なし - nullを返却')
      return null
    }

    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      })

      if (response.ok) {
        const gist = await response.json()
        const file = gist.files[`${key}.json`]
        
        if (file && file.content) {
          const data = JSON.parse(file.content)
          console.log(`✓ ${key} データをGistから読み込み成功`)
          return data
        }
      }
    } catch (error) {
      console.error('Gist読み込みエラー:', error)
    }

    return null
  }
}

// LocalStorage風のインターフェース
const simpleStorage = new SimpleStorage()

module.exports = {
  async setItem(key, value) {
    return await simpleStorage.saveData(key, value)
  },
  
  async getItem(key) {
    return await simpleStorage.loadData(key)
  },
  
  isAvailable() {
    return !!(GITHUB_TOKEN && GIST_ID)
  }
}