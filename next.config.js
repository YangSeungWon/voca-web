/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/**/@prisma/client/**/*'],
  },
}

module.exports = nextConfig