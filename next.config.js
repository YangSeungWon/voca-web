const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_MODE === 'static' ? 'export' : 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**/@prisma/client/**/*'],
  },
  images: {
    unoptimized: process.env.BUILD_MODE === 'static'
  },
  // Skip trailing slash redirect for static export
  ...(process.env.BUILD_MODE === 'static' && {
    skipTrailingSlashRedirect: true
  })
}

module.exports = withNextIntl(nextConfig)
