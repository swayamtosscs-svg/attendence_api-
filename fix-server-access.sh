#!/bin/bash

# Quick Fix Script for Server Access Issue
# Run this on Ubuntu server to fix firewall and verify server

set -e

PORT=8092
IP="103.14.120.163"

echo "🔧 Fixing Server Access Issues..."
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if pm2 list | grep -q "attendance-api.*online"; then
    echo "   ✅ Server is running in PM2"
    pm2 list | grep attendance-api
else
    echo "   ❌ Server is NOT running in PM2"
    echo "   Starting server..."
    pm2 start ecosystem.config.js
    pm2 save
    sleep 2
fi
echo ""

# Check firewall
echo "2. Checking firewall (UFW)..."
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "${PORT}/tcp"; then
        echo "   ✅ Port ${PORT} is already allowed"
    else
        echo "   ⚠️  Port ${PORT} is NOT open"
        echo "   Opening port ${PORT}..."
        sudo ufw allow ${PORT}/tcp
        echo "   ✅ Port ${PORT} opened"
    fi
    echo ""
    echo "   Current firewall status:"
    sudo ufw status | head -10
else
    echo "   ⚠️  UFW not found, checking iptables..."
    if sudo iptables -L -n | grep -q "${PORT}"; then
        echo "   ✅ Port ${PORT} found in iptables"
    else
        echo "   ⚠️  Port ${PORT} not found in iptables"
        echo "   Adding rule..."
        sudo iptables -A INPUT -p tcp --dport ${PORT} -j ACCEPT
        sudo iptables-save
        echo "   ✅ Rule added"
    fi
fi
echo ""

# Check if port is listening
echo "3. Checking if port ${PORT} is listening..."
if sudo netstat -tulpn 2>/dev/null | grep -q ":${PORT}"; then
    echo "   ✅ Port ${PORT} is listening"
    LISTENING=$(sudo netstat -tulpn | grep ":${PORT}")
    echo "   $LISTENING"
    
    # Check if it's bound to 0.0.0.0
    if echo "$LISTENING" | grep -q "0.0.0.0:${PORT}"; then
        echo "   ✅ Server is bound to 0.0.0.0 (accessible externally)"
    elif echo "$LISTENING" | grep -q "127.0.0.1:${PORT}"; then
        echo "   ❌ Server is bound to 127.0.0.1 (only localhost)"
        echo "   Fix: Make sure HOST=0.0.0.0 in .env.local or ecosystem.config.js"
    fi
else
    echo "   ❌ Port ${PORT} is NOT listening"
    echo "   Server might not be running properly"
fi
echo ""

# Test local connection
echo "4. Testing local connection..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT} | grep -q "200\|404\|500"; then
    echo "   ✅ Server responds locally"
    curl -s http://localhost:${PORT} | head -5
else
    echo "   ❌ Server does NOT respond locally"
    echo "   Check PM2 logs: pm2 logs attendance-api"
fi
echo ""

# Check cloud provider firewall (if applicable)
echo "5. Cloud Provider Firewall Check..."
echo "   ⚠️  If using AWS/DigitalOcean/Azure, check their firewall/security groups"
echo "   Make sure port ${PORT} is allowed in:"
echo "   - AWS: Security Groups"
echo "   - DigitalOcean: Firewall settings"
echo "   - Azure: Network Security Groups"
echo ""

# Summary
echo "📋 Summary:"
echo "   Server URL: http://${IP}:${PORT}"
echo ""
echo "   If still not accessible:"
echo "   1. Check cloud provider firewall (AWS/DigitalOcean/etc)"
echo "   2. Verify server logs: pm2 logs attendance-api"
echo "   3. Test from server: curl http://localhost:${PORT}"
echo "   4. Check if port is listening: sudo netstat -tulpn | grep ${PORT}"
echo ""

