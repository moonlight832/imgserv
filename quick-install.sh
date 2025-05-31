#!/bin/bash

# Quick Docker Install and Run Script
# For development and testing purposes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "🐳 Quick Docker Setup & Run"
echo "==========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log "Installing Docker..."
    
    # Update packages
    sudo apt update
    
    # Install Docker
    sudo apt install -y docker.io docker-compose
    
    # Start Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    success "Docker installed! You may need to logout/login for group permissions."
else
    success "Docker is already installed"
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose not found. Installing..."
    sudo apt install -y docker-compose
fi

# Check for .env file
if [[ ! -f ".env" ]]; then
    log "Creating .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=3000
CONVEX_DEPLOYMENT=https://aware-caiman-68.convex.cloud
CONVEX_AUTH_SECRET=project:NobleSkye:my-project-chef-ca7e4|eyJ2MiI6IjY1NmNlNzFmOWM5YzQzOTM5ZmE3NWRjZjEwYzcxNDk3In0=
EOF
    success ".env file created"
fi

# Stop any existing containers
log "Stopping existing containers..."
sudo docker-compose down 2>/dev/null || true

# Build and start the application
log "Building and starting application..."
sudo docker-compose up -d --build

# Wait a moment for startup
log "Waiting for application to start..."
sleep 10

# Check status
log "Checking application status..."
sudo docker-compose ps

# Test connectivity
if curl -s http://localhost > /dev/null 2>&1; then
    success "Application is running! Access it at http://localhost"
else
    warning "Application may still be starting. Check logs with: docker-compose logs"
fi

echo ""
echo "🎉 Quick setup complete!"
echo ""
echo "Commands:"
echo "  docker-compose ps           # Check status"
echo "  docker-compose logs -f      # View logs"
echo "  docker-compose restart      # Restart"
echo "  docker-compose down         # Stop"
echo ""
echo "Access your app: http://localhost"
