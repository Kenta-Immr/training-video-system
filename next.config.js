/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com', 'images.unsplash.com', 'localhost'],
    unoptimized: true
  },
  trailingSlash: false, // 末尾スラッシュを無効化してAPI呼び出しを修正
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
  // 完全キャッシュバスティング - 毎回新しいビルドID
  generateBuildId: async () => {
    return 'realtime-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  },
  // 静的ファイルのキャッシュも無効化
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig