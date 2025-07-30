FROM node:22-slim

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Run the Smithery CLI build directly
RUN npx @smithery/cli@1.2.14 build -o .smithery/index.cjs

# Debug: Check if the build produced the expected files
RUN ls -la
RUN ls -la .smithery/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npx", "@smithery/cli@1.2.14", "start"]
