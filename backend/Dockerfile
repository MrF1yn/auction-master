# Production Dockerfile - multi-stage build

# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

# Create non-root user first
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Set ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3010

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
