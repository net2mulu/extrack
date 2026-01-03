# Production-optimized Dockerfile for Next.js App

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Dummy DATABASE_URL for Prisma generate (not used, but required by Prisma 7)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install wget for healthcheck, Prisma CLI globally, and dotenv for prisma.config.ts
RUN apk add --no-cache wget && \
    npm install -g prisma@^7.2.0 dotenv

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and binaries
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Copy Prisma config file (needed for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy dotenv for prisma.config.ts (Prisma 7 handles TypeScript config natively)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

# Copy package.json and node_modules/.bin for npx to work
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Create entrypoint script for migrations (as root, before switching user)
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'set +e' >> /entrypoint.sh && \
    echo 'if [ -n "$DATABASE_URL" ]; then' >> /entrypoint.sh && \
    echo '  echo "=========================================="' >> /entrypoint.sh && \
    echo '  echo "Waiting for database connection..."' >> /entrypoint.sh && \
    echo '  sleep 5' >> /entrypoint.sh && \
    echo '  echo "Running database migrations..."' >> /entrypoint.sh && \
    echo '  cd /app' >> /entrypoint.sh && \
    echo '  export DATABASE_URL' >> /entrypoint.sh && \
    echo '  prisma migrate deploy' >> /entrypoint.sh && \
    echo '  MIGRATION_EXIT=$?' >> /entrypoint.sh && \
    echo '  if [ $MIGRATION_EXIT -eq 0 ]; then' >> /entrypoint.sh && \
    echo '    echo "✓ Migrations completed successfully"' >> /entrypoint.sh && \
    echo '  else' >> /entrypoint.sh && \
    echo '    echo "✗ Migration failed with exit code $MIGRATION_EXIT"' >> /entrypoint.sh && \
    echo '    echo "Continuing anyway..."' >> /entrypoint.sh && \
    echo '  fi' >> /entrypoint.sh && \
    echo '  echo "=========================================="' >> /entrypoint.sh && \
    echo 'else' >> /entrypoint.sh && \
    echo '  echo "WARNING: DATABASE_URL not set, skipping migrations"' >> /entrypoint.sh && \
    echo 'fi' >> /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
