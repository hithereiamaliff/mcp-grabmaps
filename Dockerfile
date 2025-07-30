FROM node:22-slim

WORKDIR /app

# Copy package.json and package-lock.json first for better layer caching
COPY package.json package-lock.json ./
RUN npm install

# Then copy the rest of the application
COPY . .

# Build the TypeScript files
RUN npm run build

# Verify the dist directory and files exist
RUN ls -la dist/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
