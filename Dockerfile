# MCP Server - Streamable HTTP
# For self-hosting on VPS with nginx reverse proxy

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
# Skip prepare script since source files aren't copied yet
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build:tsc

# Remove devDependencies after build
RUN npm prune --production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port for HTTP server
EXPOSE 8080

# Environment variables (can be overridden at runtime)
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the HTTP server
CMD ["node", "dist/http-server.js"]
