# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set DATABASE_URL for Prisma client generation during build
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/voca_web_db?schema=public"

# Build the application
RUN npm run build

# Generate migration SQL files
RUN npx prisma migrate deploy --skip-generate || true

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies (netcat for database wait, wget for healthcheck)
RUN apk add --no-cache openssl libc6-compat netcat-openbsd wget

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy Prisma binaries
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy geoip-lite and its dependencies for IP-based locale detection
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/geoip-lite ./node_modules/geoip-lite
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/async ./node_modules/async
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ip-address ./node_modules/ip-address
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/jsbn ./node_modules/jsbn
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sprintf-js ./node_modules/sprintf-js

# Copy start script
COPY --chown=nextjs:nodejs start.sh ./start.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV GEODATADIR="/app/node_modules/geoip-lite/data"

# Start the application with migration
CMD ["sh", "start.sh"]