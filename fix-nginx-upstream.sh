#!/bin/bash

# Fix Nginx Upstream Connection Script
# This script diagnoses and fixes the "Connection refused" issue with Nginx upstream

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. This is okay for system operations."
    else
        log "Running as non-root user. Some operations may require sudo."
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system prerequisites
check_prerequisites() {
    log "Checking system prerequisites..."
    
    if ! command_exists docker; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    success "All prerequisites are installed."
}

# Check current service status
check_service_status() {
    log "Checking current service status..."
    
    echo "=== Docker containers status ==="
    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo -e "\n=== Nginx process status ==="
    if pgrep nginx > /dev/null; then
        success "Nginx is running"
        systemctl status nginx --no-pager -l || true
    else
        warning "Nginx is not running"
    fi
    
    echo -e "\n=== Port 3000 status ==="
    if netstat -tlnp 2>/dev/null | grep :3000; then
        success "Something is listening on port 3000"
    else
        warning "Nothing is listening on port 3000"
    fi
    
    echo -e "\n=== Docker network status ==="
    docker network ls | grep skyechat || warning "Skyechat network not found"
}

# Check Docker Compose configuration
check_docker_config() {
    log "Checking Docker Compose configuration..."
    
    if [[ ! -f "docker-compose.yml" ]]; then
        error "docker-compose.yml not found in current directory"
        exit 1
    fi
    
    # Validate docker-compose file
    if docker-compose config > /dev/null 2>&1; then
        success "Docker Compose configuration is valid"
    else
        error "Docker Compose configuration has errors:"
        docker-compose config
        exit 1
    fi
}

# Check environment variables
check_environment() {
    log "Checking environment variables..."
    
    if [[ -f ".env" ]]; then
        log "Found .env file"
        # Check for required variables
        if grep -q "CONVEX_DEPLOYMENT" .env && grep -q "CONVEX_AUTH_SECRET" .env; then
            success "Required environment variables found in .env"
        else
            warning "Some required environment variables may be missing from .env"
        fi
    else
        warning ".env file not found. Environment variables may not be set."
    fi
}

# Stop and clean up existing containers
cleanup_containers() {
    log "Cleaning up existing containers..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans || true
    
    # Remove any dangling containers
    docker container prune -f || true
    
    success "Container cleanup completed"
}

# Check and fix Nginx configuration
check_nginx_config() {
    log "Checking Nginx configuration..."
    
    if [[ ! -f "nginx.conf" ]]; then
        error "nginx.conf not found in current directory"
        exit 1
    fi
    
    # Test nginx configuration syntax
    if docker run --rm -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:alpine nginx -t; then
        success "Nginx configuration syntax is valid"
    else
        error "Nginx configuration has syntax errors"
        exit 1
    fi
}

# Build and start services
start_services() {
    log "Building and starting services..."
    
    # Build the application
    log "Building application container..."
    docker-compose build --no-cache skyechat
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    log "Waiting for services to become healthy..."
    
    # Wait for the application container to be running
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps skyechat | grep -q "Up"; then
            success "Application container is running"
            break
        fi
        
        log "Attempt $attempt/$max_attempts: Waiting for application container..."
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        error "Application container failed to start within timeout"
        docker-compose logs skyechat
        exit 1
    fi
    
    # Wait for the application to respond on port 3000
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if docker exec skyechat-app curl -f http://localhost:3000/health > /dev/null 2>&1; then
            success "Application is responding on port 3000"
            break
        fi
        
        log "Attempt $attempt/$max_attempts: Waiting for application to respond..."
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        warning "Application may not be responding on health endpoint, but container is running"
    fi
}

# Test the complete setup
test_setup() {
    log "Testing the complete setup..."
    
    # Test internal connectivity
    if docker exec skyechat-nginx curl -f http://skyechat:3000 > /dev/null 2>&1; then
        success "Nginx can reach the application container"
    else
        error "Nginx cannot reach the application container"
        docker-compose logs
        exit 1
    fi
    
    # Test external connectivity
    if curl -f http://localhost > /dev/null 2>&1; then
        success "External access is working"
    else
        warning "External access may not be working. Check firewall and port forwarding."
    fi
}

# Show service logs
show_logs() {
    log "Showing recent service logs..."
    
    echo "=== Application logs ==="
    docker-compose logs --tail=20 skyechat
    
    echo -e "\n=== Nginx logs ==="
    docker-compose logs --tail=20 nginx
}

# Show final status
show_final_status() {
    log "Final system status:"
    
    echo "=== Container status ==="
    docker-compose ps
    
    echo -e "\n=== Port bindings ==="
    docker-compose ps --format "table {{.Name}}\t{{.Ports}}"
    
    echo -e "\n=== Network information ==="
    docker network inspect skyechat-network_skyechat-network 2>/dev/null | grep -A 10 "Containers" || true
    
    success "Setup completed! Your application should be accessible at:"
    echo "  - http://localhost (through Nginx)"
    echo "  - http://localhost:3000 (direct access)"
}

# Create a simple health check endpoint if it doesn't exist
create_health_endpoint() {
    log "Checking for health endpoint..."
    
    # This is handled by the Dockerfile and application code
    # Just verify the container has the health check
    if docker-compose ps skyechat | grep -q "healthy\|starting"; then
        success "Health check is configured"
    else
        warning "Health check may not be properly configured"
    fi
}

# Main execution
main() {
    log "Starting Nginx upstream connection fix..."
    
    # Change to the script directory
    cd "$(dirname "$0")"
    
    check_root
    check_prerequisites
    check_docker_config
    check_environment
    check_nginx_config
    
    log "Current status before fixes:"
    check_service_status
    
    cleanup_containers
    start_services
    wait_for_services
    create_health_endpoint
    test_setup
    
    show_logs
    show_final_status
    
    success "All operations completed successfully!"
    log "If you're still experiencing issues, check the logs above and ensure your firewall allows traffic on ports 80 and 3000."
}

# Handle script interruption
trap 'error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
