FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Create temp directory for video processing
RUN mkdir -p /tmp/flowcast

EXPOSE 3000

CMD ["npm", "run", "dev"]
