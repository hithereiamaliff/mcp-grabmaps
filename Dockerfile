# Build stage
FROM node:22-slim AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Ensure dist directory exists
RUN mkdir -p dist

# Run TypeScript compilation
RUN npm run build

# Debug: Check if the build produced the expected files
RUN ls -la dist/

# Final stage
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/smithery.yaml ./

# Verify the file exists
RUN ls -la dist/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/smithery.js"]
