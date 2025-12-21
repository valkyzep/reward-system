/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  devIndicators: {
    buildActivity: true
  },
  experimental: {
    optimizeCss: true
  }
}

module.exports = nextConfig