# =================================
# Stage 1: Dependencies & Build
# =================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies, including devDependencies for building
# Using 'npm ci' is generally faster and more reliable for CI/CD environments
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Generate Prisma Client to be available for the build process
RUN npx prisma generate

# Build the TypeScript source code
RUN npm run build

# =================================
# Stage 2: Production Image
# =================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create a non-root user to run the application for better security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application and necessary assets from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# The generated client is inside node_modules, ensure it's copied
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose the port the app runs on
EXPOSE 4000

# The command to run the application is now in docker-compose.yml
# This allows for more flexibility, like running migrations before starting.
# CMD ["node", "dist/index.js"]