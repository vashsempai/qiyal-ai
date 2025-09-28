/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true
  },
  images: {
    domains: ['localhost']
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY
  },
  output: 'standalone',
}

module.exports = nextConfig
