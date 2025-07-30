FROM node:22-slim

WORKDIR /app

# Copy package.json and package-lock.json first for better layer caching
COPY package.json package-lock.json ./
RUN npm install

# Then copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
