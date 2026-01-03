# Production Dockerfile for Next.js App

FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache wget && \
    npm install -g prisma@^7.2.0 dotenv

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Dummy DATABASE_URL for Prisma generate (required by Prisma 7)
ENV DATABASE_URL="postgres://postgres:2LAoQPSDxo5Axe8nj2FgTfmc3FqeGNfDuQnBB1ZVHqJRlAGJ494geEML4NUk6q4h@fc400ccg0o0wwco44gocsk4s:5432/postgres"

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the app - migrations can be run manually via docker exec
CMD ["npm", "start"]
