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
  // キャッシュバスティング
  generateBuildId: async () => {
    return 'fix-api-' + Date.now()
  }
}

module.exports = nextConfig