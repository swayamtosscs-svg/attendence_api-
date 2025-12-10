# Quick Deployment Guide - Ubuntu VPS

## Prerequisites
- Ubuntu server with Node.js 18+ installed
- MongoDB installed and running
- Git installed
- SSH access to server

## Quick Deploy (One Command)

```bash
# SSH into your Ubuntu server
ssh user@103.14.120.163

# Run the deployment script
cd /var/www/html/attendence_api
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

## Manual Deployment Steps

### 1. SSH into Ubuntu Server
```bash
ssh user@103.14.120.163
```

### 2. Navigate to Project Directory
```bash
cd /var/www/html/attendence_api
```

### 3. Pull Latest Code
```bash
git pull origin main
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Build Application
```bash
npm run build
```

### 6. Configure Environment Variables
```bash
# Create .env.local if it doesn't exist
cp env.local.example .env.local

# Edit .env.local
nano .env.local
```

**Important:** Update these values:
```env
# Use localhost if MongoDB is on same server (RECOMMENDED)
MONGODB_URI=mongodb://Toss:Toss%40123@localhost:27017/attendence?authSource=admin

# Use a strong random string for AUTH_SECRET
AUTH_SECRET=your-strong-random-secret-here
```

### 7. Start with PM2
```bash
# Stop existing process
pm2 stop attendance-api 2>/dev/null || true
pm2 delete attendance-api 2>/dev/null || true

# Start new process
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (usually with sudo)
```

### 8. Open Firewall Port
```bash
# Check firewall status
sudo ufw status

# Allow port 8092 (default production port)
sudo ufw allow 8092/tcp

# Verify
sudo ufw status
```

### 9. Verify Server is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs attendance-api

# Test locally
curl http://localhost:8092

# Test from external (should work now)
curl http://103.14.120.163:8092
# Note: Default port is 8092, can be changed via PORT env variable
```

## Fix MongoDB Connection Issue

### Option 1: Use localhost (Recommended)
If MongoDB is on the same server, use `localhost` in `.env.local`:
```env
MONGODB_URI=mongodb://Toss:Toss%40123@localhost:27017/attendence?authSource=admin
```

### Option 2: Configure MongoDB for External Access
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Change bindIp to 0.0.0.0
net:
  port: 27017
  bindIp: 0.0.0.0

# Restart MongoDB
sudo systemctl restart mongod

# Open MongoDB port in firewall
sudo ufw allow 27017/tcp
```

## Troubleshooting

### Server Not Accessible
1. Check if server is running: `pm2 status`
2. Check server logs: `pm2 logs attendance-api`
3. Check firewall: `sudo ufw status`
4. Check if port is listening: `sudo netstat -tulpn | grep 8087`

### MongoDB Connection Error
1. Check MongoDB is running: `sudo systemctl status mongod`
2. Test MongoDB connection: `mongosh "mongodb://Toss:Toss%40123@localhost:27017/attendence?authSource=admin"`
3. Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
4. Verify `.env.local` has correct MongoDB URI

### Port Already in Use
```bash
# Find process using port 8087
sudo lsof -i :8087

# Kill the process
sudo kill -9 <PID>
```

## Common Commands

```bash
# View logs
pm2 logs attendance-api

# Restart server
pm2 restart attendance-api

# Stop server
pm2 stop attendance-api

# Monitor resources
pm2 monit

# Check server status
pm2 status
```

## Verify Deployment

After deployment, test the API:
```bash
# Test login endpoint
curl -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "swayam@gmail.com",
    "password": "Swayam@123"
  }'
```

If you get a response (even an error about credentials), the server is working!

