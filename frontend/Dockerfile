# =================================
# Stage 1: Build Stage
# =================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies using npm ci for consistency
RUN npm ci

# Copy the rest of the application source code
# The .dockerignore file will prevent unnecessary files from being copied
COPY . .

# Build the Next.js application
# The 'standalone' output option in next.config.js will be used here
RUN npm run build

# =================================
# Stage 2: Production Stage
# =================================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create a non-root user 'nextjs' and a group 'nextjs' for security
RUN addgroup -g 1001 -S nextjs
RUN adduser -S nextjs -u 1001

# Copy the standalone output from the builder stage
# This includes the server, public assets, and a minimal node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change the ownership of the application files to the non-root user
RUN chown -R nextjs:nextjs .

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the NEXT_TELEMETRY_DISABLED environment variable to disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Command to run the application
CMD ["node", "server.js"]