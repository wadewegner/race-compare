FROM node:18-alpine

WORKDIR /app

# Install Chromium and dependencies
RUN apk add --no-cache chromium ca-certificates
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8080

# Start the app
CMD ["npm", "start"] 