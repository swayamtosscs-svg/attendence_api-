# Ubuntu Server Deployment - Complete Guide

## Server: 103.14.120.163:8092

## Step-by-Step Deployment

### Step 1: SSH into Ubuntu Server
```bash
ssh root@103.14.120.163
```

### Step 2: Navigate to Project Directory
```bash
cd /var/www/html/attendence_api
```

### Step 3: Pull Latest Code
```bash
git pull origin main
```

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Build the Application
```bash
npm run build
```

### Step 6: Configure Environment Variables
```bash
# Create or edit .env.local
nano .env.local
```

**Important:** Add these values:
```env
MONGODB_URI=mongodb://Toss:Toss%40123@localhost:27017/attendence?authSource=admin
AUTH_SECRET=your-strong-secret-here
PORT=8092
HOST=0.0.0.0
NODE_ENV=production
```

### Step 7: Open Firewall Port 8092
```bash
# Check firewall status
sudo ufw status

# Allow port 8092
sudo ufw allow 8092/tcp

# Verify
sudo ufw status | grep 8092
```

### Step 8: Install PM2 (if not installed)
```bash
npm install -g pm2
```

### Step 9: Stop Old Process (if running)
```bash
pm2 stop attendance-api 2>/dev/null || true
pm2 delete attendance-api 2>/dev/null || true
```

### Step 10: Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Run the command that PM2 outputs (usually with sudo)
```

### Step 11: Verify Server is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs attendance-api --lines 50

# Check if port is listening
sudo netstat -tulpn | grep 8092
# Should show: 0.0.0.0:8092

# Test locally
curl http://localhost:8092
```

### Step 12: Test from External
```bash
# From your local machine
curl http://103.14.120.163:8092

# Or test login API
curl -X POST http://103.14.120.163:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"swayam@gmail.com","password":"Swayam@123"}'
```

## Troubleshooting

### Server Not Accessible
1. **Check if server is running:**
   ```bash
   pm2 status
   ```

2. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 8092/tcp
   ```

3. **Check if port is listening:**
   ```bash
   sudo netstat -tulpn | grep 8092
   # Should show: 0.0.0.0:8092 (NOT 127.0.0.1:8092)
   ```

4. **Check server logs:**
   ```bash
   pm2 logs attendance-api
   ```

### MongoDB Connection Error
1. **Check MongoDB is running:**
   ```bash
   sudo systemctl status mongod
   ```

2. **Test MongoDB connection:**
   ```bash
   mongosh "mongodb://Toss:Toss%40123@localhost:27017/attendence?authSource=admin"
   ```

3. **Verify .env.local has correct MongoDB URI:**
   ```bash
   cat .env.local | grep MONGODB_URI
   # Should show: MONGODB_URI=mongodb://Toss:Toss%40123@localhost:27017/...
   ```

### Port Already in Use
```bash
# Find process using port 8092
sudo lsof -i :8092
# or
sudo netstat -tulpn | grep 8092

# Kill the process if needed
sudo kill -9 <PID>
```

## Quick Commands Reference

```bash
# Restart server
pm2 restart attendance-api

# View logs
pm2 logs attendance-api

# Stop server
pm2 stop attendance-api

# Check status
pm2 status

# Monitor resources
pm2 monit
```

## Complete Deployment Script

Run this on Ubuntu server:

```bash
cd /var/www/html/attendence_api && \
git pull origin main && \
npm install && \
npm run build && \
sudo ufw allow 8092/tcp && \
pm2 stop attendance-api 2>/dev/null || true && \
pm2 delete attendance-api 2>/dev/null || true && \
pm2 start ecosystem.config.js && \
pm2 save && \
pm2 logs attendance-api
```

