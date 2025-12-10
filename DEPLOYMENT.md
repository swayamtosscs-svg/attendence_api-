# Ubuntu VPS Deployment Guide

## Prerequisites
- Node.js (v18 or higher)
- PM2 (for process management)
- MongoDB connection configured

## Quick Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

### 3. Configure Environment Variables
Create `.env.local` file (copy from `env.local.example`):
```bash
cp env.local.example .env.local
# Edit .env.local with your MongoDB URI and AUTH_SECRET
```

### 4. Start with PM2 (Recommended for Production)
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 5. Verify Server is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs attendance-api

# Test the server
curl http://localhost:8092
# Or from external: http://103.14.120.163:8092
# Note: Default port is 8092, can be changed via PORT environment variable
```

## Alternative: Direct Node.js Start
```bash
# Set environment variables
export NODE_ENV=production
export PORT=8092
export HOST=0.0.0.0

# Start server
npm start
```

## Firewall Configuration (Ubuntu)
Make sure port 8092 is open (or 8087 if using that):
```bash
# Check if ufw is active
sudo ufw status

# Allow port 8092 (default production port)
sudo ufw allow 8092/tcp

# Or if using port 8087
sudo ufw allow 8087/tcp

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 8092 -j ACCEPT
```

## PM2 Management Commands
```bash
# Stop the application
pm2 stop attendance-api

# Restart the application
pm2 restart attendance-api

# View logs
pm2 logs attendance-api

# Monitor resources
pm2 monit

# Delete from PM2
pm2 delete attendance-api
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8092 (or 8087)
sudo lsof -i :8092
# or
sudo netstat -tulpn | grep 8092

# Kill the process if needed
sudo kill -9 <PID>

# Or use a different port by setting PORT environment variable
export PORT=8087
pm2 restart attendance-api
```

### Server Not Accessible Externally
1. Check firewall rules
2. Verify server is binding to `0.0.0.0` (not `127.0.0.1`)
3. Check VPS security group/firewall settings in cloud provider console

### Check Server Logs
```bash
# PM2 logs
pm2 logs attendance-api --lines 100

# Or if running directly
# Check console output
```

## Environment Variables
The server uses these environment variables:
- `PORT`: Server port (default: 8092 for production, 3000 for local dev)
- `HOST`: Hostname to bind (default: 0.0.0.0)
- `NODE_ENV`: Environment mode (production/development)
- `MONGODB_URI`: MongoDB connection string
- `AUTH_SECRET`: JWT secret key

## After Git Pull on VPS
```bash
cd /var/www/html/attendence_api
git pull origin main
npm install
npm run build
pm2 restart attendance-api
```

