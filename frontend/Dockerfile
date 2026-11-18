# Use the official, lightweight Node 20 image
FROM node:20-slim

WORKDIR /app

# Copy the package manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy the React source code
COPY . .

# Expose Vite's default development port
EXPOSE 5173

# Boot the Vite dev server and bind it to all network interfaces
CMD ["npm", "run", "dev", "--", "--host"]