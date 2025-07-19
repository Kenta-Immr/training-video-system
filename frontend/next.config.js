/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com', 'images.unsplash.com', 'localhost'],
    unoptimized: true
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig