#!/bin/bash

# Quick Diagnostic Script for Nginx Upstream Issues
# This script provides a quick diagnosis of the current state

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "============================================"
echo "  Quick Nginx Upstream Diagnostic"
echo "============================================"

# Check Docker containers
log "Checking Docker containers..."
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(skyechat|nginx)"; then
    success "Found Docker containers"
else
    error "No relevant Docker containers found"
fi

echo ""

# Check port 3000
log "Checking port 3000..."
if netstat -tlnp 2>/dev/null | grep :3000; then
    success "Port 3000 is in use"
else
    error "Nothing listening on port 3000"
fi

echo ""

# Check Nginx status
log "Checking Nginx..."
if pgrep nginx > /dev/null; then
    success "Nginx process is running"
else
    error "Nginx is not running"
fi

echo ""

# Check application container logs
log "Recent application logs:"
docker-compose logs --tail=5 skyechat 2>/dev/null || echo "Could not get application logs"

echo ""

# Check Nginx logs
log "Recent Nginx error logs:"
docker-compose logs --tail=5 nginx 2>/dev/null || tail -5 /var/log/nginx/error.log 2>/dev/null || echo "Could not get Nginx logs"

echo ""

# Test connectivity
log "Testing connectivity..."
if docker exec skyechat-app curl -s http://localhost:3000 > /dev/null 2>&1; then
    success "Application responds internally"
else
    error "Application not responding internally"
fi

if curl -s http://localhost > /dev/null 2>&1; then
    success "External access works"
else
    error "External access fails"
fi

echo ""
echo "============================================"
echo "Quick fixes to try:"
echo "1. Run: docker-compose restart"
echo "2. Run: ./fix-nginx-upstream.sh"
echo "3. Check logs: docker-compose logs"
echo "============================================"
