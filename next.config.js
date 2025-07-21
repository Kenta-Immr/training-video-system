/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com', 'images.unsplash.com', 'localhost'],
    unoptimized: true
  },
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // 安定したビルドID（デプロイ安定性のため）
  generateBuildId: async () => {
    // 日次ベースの安定したビルドID
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    return `stable-${today}-${process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'dev'}`
  },
  // バランスの取れたキャッシュ戦略
  async headers() {
    return [
      {
        // APIのみキャッシュ無効化
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
      {
        // 静的アセットは適切にキャッシュ
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig