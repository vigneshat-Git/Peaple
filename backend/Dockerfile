# Use Node 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist ./dist

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
