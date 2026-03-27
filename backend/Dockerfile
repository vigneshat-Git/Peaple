# Use Node 20
FROM node:20-alpine

# Install ffmpeg (for video processing)
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "dist/index.js"]