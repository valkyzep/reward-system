/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  // Removed basePath and assetPrefix for local development
  images: {
    unoptimized: true
  },
  devIndicators: {
    buildActivity: true
  },
}

module.exports = nextConfig