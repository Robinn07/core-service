# Use the official Node.js image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the source code
COPY . .

# Expose the port for the Email Automation module
EXPOSE 3001

# Start the Node.js application
CMD ["node", "src/server.js"]