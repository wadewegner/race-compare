# Use multi-platform build
FROM --platform=$BUILDPLATFORM ghcr.io/puppeteer/puppeteer:21.7.0

# Create and set working directory
WORKDIR /app

# Change ownership of the working directory to the puppeteer user
RUN chown -R pptruser:pptruser /app

# Switch to the puppeteer user
USER pptruser

# Copy package files with correct ownership
COPY --chown=pptruser:pptruser package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application with correct ownership
COPY --chown=pptruser:pptruser . .

# Expose the port
EXPOSE 8080

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Start the app
CMD ["npm", "start"] 