# Quick Fix - Server Not Accessible on 103.14.120.163:8092

## Problem
Server is running but not accessible from browser (ERR_CONNECTION_TIMED_OUT)

## Quick Fix (Run on Ubuntu Server)

### Option 1: Use the Fix Script
```bash
cd /var/www/html/attendence_api
chmod +x fix-server-access.sh
bash fix-server-access.sh
```

### Option 2: Manual Fix

#### Step 1: Open Firewall Port
```bash
# Check firewall status
sudo ufw status

# Open port 8092
sudo ufw allow 8092/tcp

# Verify
sudo ufw status | grep 8092
```

#### Step 2: Verify Server is Running
```bash
# Check PM2 status
pm2 status

# If not running, start it
pm2 start ecosystem.config.js
pm2 save
```

#### Step 3: Check Port is Listening
```bash
# Check if port 8092 is listening on 0.0.0.0 (not 127.0.0.1)
sudo netstat -tulpn | grep 8092

# Should show: 0.0.0.0:8092
# If shows 127.0.0.1:8092, server won't be accessible externally
```

#### Step 4: Test Locally
```bash
# Test from server itself
curl http://localhost:8092

# Should return some response (even if 404)
```

#### Step 5: Check Cloud Provider Firewall
If using AWS, DigitalOcean, Azure, etc., check their firewall:
- **AWS**: Security Groups → Allow inbound on port 8092
- **DigitalOcean**: Firewall → Add rule for port 8092
- **Azure**: Network Security Groups → Allow port 8092

## Common Issues

### Issue 1: Firewall Blocking Port
**Solution:**
```bash
sudo ufw allow 8092/tcp
sudo ufw reload
```

### Issue 2: Server Bound to localhost Only
**Check .env.local:**
```env
HOST=0.0.0.0
PORT=8092
```

**Or check ecosystem.config.js:**
```javascript
env: {
  HOST: '0.0.0.0',
  PORT: 8092
}
```

### Issue 3: Cloud Provider Firewall
Check your VPS provider's firewall/security group settings and allow port 8092.

### Issue 4: Server Not Running
```bash
# Start server
pm2 start ecosystem.config.js
pm2 save

# Check logs
pm2 logs attendance-api
```

## Complete Verification Commands

```bash
# 1. Check PM2
pm2 status

# 2. Check firewall
sudo ufw status

# 3. Check port
sudo netstat -tulpn | grep 8092

# 4. Test locally
curl http://localhost:8092

# 5. View logs
pm2 logs attendance-api --lines 50
```

## After Fixing

Test from browser:
```
http://103.14.120.163:8092
```

Or from command line:
```bash
curl http://103.14.120.163:8092
```

