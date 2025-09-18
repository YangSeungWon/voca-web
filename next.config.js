/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_MODE === 'static' ? 'export' : 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**/@prisma/client/**/*'],
  },
  images: {
    unoptimized: process.env.BUILD_MODE === 'static'
  },
  // Skip API routes during static export
  ...(process.env.BUILD_MODE === 'static' && {
    experimental: {
      // Skip API routes in static export
      skipTrailingSlashRedirect: true
    }
  })
}

module.exports = nextConfig