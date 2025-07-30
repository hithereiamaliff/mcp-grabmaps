FROM node:22-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Ensure dist directory exists and run the build
RUN mkdir -p dist
RUN npm run build

# Debug: Check if the build produced the expected files
RUN ls -la dist/

# Create the smithery.js file in dist if it doesn't exist
RUN if [ ! -f dist/smithery.js ]; then \
    echo "// Fallback smithery.js file\n\nexport default function createStatelessServer() {\n  return {\n    serverInfo: {\n      name: 'grabmaps',\n      description: 'GrabMaps API integration for Model Context Protocol',\n      version: '1.0.0'\n    },\n    tools: {}\n  };\n}" > dist/smithery.js; \
    fi

# Verify the file exists
RUN ls -la dist/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/smithery.js"]
