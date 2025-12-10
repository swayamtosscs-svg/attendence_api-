# Fix Server Access Issue - Step by Step

## Problem
Server is running on Ubuntu VPS but not accessible from browser at `http://103.14.120.163:8087`

## Quick Fix Steps

### Step 1: Check Server Status
```bash
# Run the diagnostic script
chmod +x check-server.sh
./check-server.sh
```

### Step 2: Open Firewall Port (Most Common Issue)
```bash
# Check firewall status
sudo ufw status

# Allow port 8092 (default) or 8087
sudo ufw allow 8092/tcp
# Or if using 8087:
sudo ufw allow 8087/tcp

# Verify
sudo ufw status | grep 8092
```

### Step 3: Verify Server is Bound to 0.0.0.0
```bash
# Check what the server is listening on
sudo netstat -tulpn | grep 8087
# or
sudo ss -tulpn | grep 8087
```

**Should show:** `0.0.0.0:8087` (NOT `127.0.0.1:8087`)

### Step 4: Use PM2 Instead of Direct npm start
```bash
# Stop current process (Ctrl+C if running in terminal)

# Install PM2 if not installed
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Check status
pm2 status
pm2 logs attendance-api
```

### Step 5: Test Server
```bash
# Test locally
curl http://localhost:8092

# Test from another machine or use online tool
curl http://103.14.120.163:8092
```

## Common Issues and Solutions

### Issue 1: Firewall Blocking Port
**Solution:**
```bash
sudo ufw allow 8092/tcp
# Or if using 8087:
sudo ufw allow 8087/tcp
sudo ufw reload
```

### Issue 2: Server Bound to localhost Only
**Check server.js** - should have:
```javascript
const hostname = process.env.HOST || "0.0.0.0";
```

### Issue 3: Cloud Provider Firewall
If using AWS, DigitalOcean, etc., check their firewall/security groups:
- AWS: Security Groups
- DigitalOcean: Firewall settings
- Azure: Network Security Groups

Allow inbound traffic on port 8087.

### Issue 4: Server Not Running in Background
**Solution:** Use PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Complete Setup Commands

```bash
# 1. Navigate to project
cd /var/www/html/attendence_api

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Build
npm run build

# 5. Configure environment
nano .env.local
# Make sure MONGODB_URI uses localhost if MongoDB is on same server

# 6. Open firewall
sudo ufw allow 8092/tcp
# Or if you want to use 8087, set PORT=8087 in .env.local

# 7. Start with PM2
pm2 stop attendance-api 2>/dev/null || true
pm2 delete attendance-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it outputs

# 8. Check status
pm2 status
pm2 logs attendance-api

# 9. Test
curl http://localhost:8087
```

## Verify Everything Works

```bash
# 1. Check PM2 status
pm2 status
# Should show: online

# 2. Check logs
pm2 logs attendance-api --lines 50
# Should show: "✅ Next.js server ready at http://0.0.0.0:8087"

# 3. Check port
sudo netstat -tulpn | grep 8092
# Should show: 0.0.0.0:8092

# 4. Check firewall
sudo ufw status | grep 8092
# Should show: 8092/tcp ALLOW

# 5. Test API
curl -X POST http://localhost:8092/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## If Still Not Working

1. **Check cloud provider firewall** (AWS, DigitalOcean, etc.)
2. **Check if port 8092 is already in use:**
   ```bash
   sudo lsof -i :8092
   ```
3. **Check server logs for errors:**
   ```bash
   pm2 logs attendance-api
   ```
4. **Try a different port** (e.g., 8087) to test:
   ```bash
   PORT=8087 pm2 restart attendance-api
   sudo ufw allow 8087/tcp
   ```

