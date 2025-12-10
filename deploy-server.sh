#!/bin/bash

# Complete Server Deployment Script for Ubuntu
# Run this on Ubuntu server: bash deploy-server.sh

set -e

echo "🚀 Starting Server Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/var/www/html/attendence_api"
PORT=8092
IP="103.14.120.163"

cd $PROJECT_DIR

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin main

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 3: Building application...${NC}"
npm run build

echo -e "${YELLOW}Step 4: Checking .env.local...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}⚠️  .env.local not found!${NC}"
    echo "Creating from example..."
    cp env.local.example .env.local
    echo -e "${YELLOW}⚠️  Please edit .env.local with your MongoDB URI and AUTH_SECRET!${NC}"
    echo "   nano .env.local"
    read -p "Press Enter after editing .env.local..."
fi

echo -e "${YELLOW}Step 5: Opening firewall port ${PORT}...${NC}"
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "${PORT}/tcp"; then
        echo -e "${GREEN}✓ Port ${PORT} is already allowed${NC}"
    else
        sudo ufw allow ${PORT}/tcp
        echo -e "${GREEN}✓ Port ${PORT} opened${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  UFW not found. Make sure port ${PORT} is open in firewall${NC}"
fi

echo -e "${YELLOW}Step 6: Installing PM2 (if needed)...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo -e "${YELLOW}Step 7: Stopping old process...${NC}"
pm2 stop attendance-api 2>/dev/null || true
pm2 delete attendance-api 2>/dev/null || true

echo -e "${YELLOW}Step 8: Starting with PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save

echo -e "${YELLOW}Step 9: Setting up PM2 startup...${NC}"
pm2 startup | grep "sudo" | bash || echo "PM2 startup already configured"

echo -e "${YELLOW}Step 10: Waiting for server to start...${NC}"
sleep 3

echo -e "${YELLOW}Step 11: Verifying deployment...${NC}"
echo ""

# Check PM2 status
if pm2 list | grep -q "attendance-api.*online"; then
    echo -e "${GREEN}✓ PM2: Server is running${NC}"
else
    echo -e "${RED}✗ PM2: Server is NOT running${NC}"
    pm2 logs attendance-api --lines 20
    exit 1
fi

# Check port
if sudo netstat -tulpn 2>/dev/null | grep -q ":${PORT}"; then
    echo -e "${GREEN}✓ Port ${PORT} is listening${NC}"
    sudo netstat -tulpn | grep ":${PORT}"
else
    echo -e "${RED}✗ Port ${PORT} is NOT listening${NC}"
fi

# Test local connection
if curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT} | grep -q "200\|404\|500"; then
    echo -e "${GREEN}✓ Server responds locally${NC}"
else
    echo -e "${RED}✗ Server does NOT respond locally${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Server URLs:"
echo "  - Local:    http://localhost:${PORT}"
echo "  - Network:  http://0.0.0.0:${PORT}"
echo "  - External: http://${IP}:${PORT}"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check server status"
echo "  pm2 logs attendance-api - View logs"
echo "  pm2 restart attendance-api - Restart server"
echo ""
echo "Test the server:"
echo "  curl http://${IP}:${PORT}"
echo ""

