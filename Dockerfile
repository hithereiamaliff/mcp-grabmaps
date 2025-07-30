FROM node:22-slim

WORKDIR /app

# Copy package.json and package-lock.json first for better layer caching
COPY package.json package-lock.json ./
RUN npm install

# Then copy the rest of the application
COPY . .

# Create dist directory
RUN mkdir -p dist

# Build the TypeScript files
RUN npm run build

# Verify the dist directory and files exist
RUN ls -la dist/

# Copy smithery.js to dist if it doesn't exist (fallback)
RUN if [ ! -f dist/smithery.js ]; then cp src/smithery.ts dist/smithery.js; fi

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
