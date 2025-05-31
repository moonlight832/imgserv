#!/bin/bash

# Complete Docker Installation and Application Deployment Script
# This script installs Docker and runs your SkyeChat application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/moonlight832/imgserv.git"
APP_DIR="/opt/skyechat"
CONVEX_DEPLOYMENT="https://aware-caiman-68.convex.cloud"
CONVEX_AUTH_SECRET="project:NobleSkye:my-project-chef-ca7e4|eyJ2MiI6IjY1NmNlNzFmOWM5YzQzOTM5ZmE3NWRjZjEwYzcxNDk3In0="

# Logging functions
log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
header() { echo -e "${CYAN}$1${NC}"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        error "Cannot detect OS. This script supports Ubuntu/Debian systems."
        exit 1
    fi
    
    log "Detected OS: $OS $VER"
}

# Check if running as root
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo $0"
        exit 1
    fi
    success "Running with root privileges"
}

# Update system packages
update_system() {
    header "📦 Updating System Packages"
    
    log "Updating package lists..."
    apt update -y
    
    log "Upgrading existing packages..."
    apt upgrade -y
    
    log "Installing essential packages..."
    apt install -y curl wget git software-properties-common apt-transport-https ca-certificates gnupg lsb-release ufw
    
    success "System packages updated"
}

# Install Docker
install_docker() {
    header "🐳 Installing Docker"
    
    if command_exists docker; then
        warning "Docker is already installed"
        docker --version
        return 0
    fi
    
    log "Removing old Docker installations..."
    apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    log "Adding Docker GPG key..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    log "Adding Docker repository..."
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    log "Installing Docker Engine..."
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    log "Starting Docker service..."
    systemctl start docker
    systemctl enable docker
    
    # Add user to docker group
    if [[ -n "$SUDO_USER" ]]; then
        usermod -aG docker "$SUDO_USER"
        log "Added $SUDO_USER to docker group"
    fi
    
    success "Docker installed successfully"
    docker --version
}

# Install Docker Compose (standalone)
install_docker_compose() {
    header "🔧 Installing Docker Compose"
    
    if command_exists docker-compose; then
        warning "Docker Compose is already installed"
        docker-compose --version
        return 0
    fi
    
    log "Downloading Docker Compose..."
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    log "Making Docker Compose executable..."
    chmod +x /usr/local/bin/docker-compose
    
    success "Docker Compose installed successfully"
    docker-compose --version
}

# Clone or update repository
setup_repository() {
    header "📂 Setting Up Repository"
    
    if [[ -d "$APP_DIR" ]]; then
        warning "Application directory exists. Updating..."
        cd "$APP_DIR"
        git pull origin main || git pull origin master || true
    else
        log "Cloning repository..."
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
    fi
    
    success "Repository ready at $APP_DIR"
}

# Create environment file
create_environment() {
    header "⚙️  Creating Environment Configuration"
    
    cd "$APP_DIR"
    
    log "Creating .env file..."
    cat > .env << EOF
# SkyeChat Environment Configuration
NODE_ENV=production
PORT=3000

# Convex Configuration
CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
CONVEX_AUTH_SECRET=${CONVEX_AUTH_SECRET}

# Optional: Add your domain here
# DOMAIN=your-domain.com
EOF
    
    success "Environment file created"
}

# Configure firewall
setup_firewall() {
    header "🔥 Configuring Firewall"
    
    log "Setting up UFW firewall rules..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Allow SSH (important!)
    ufw allow OpenSSH
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Docker port (optional, for direct access)
    ufw allow 3000/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
    ufw status
}

# Build and start application
deploy_application() {
    header "🚀 Deploying Application"
    
    cd "$APP_DIR"
    
    log "Building Docker images..."
    docker-compose build --no-cache
    
    log "Starting services..."
    docker-compose up -d
    
    success "Application deployed"
}

# Wait for application to start
wait_for_app() {
    header "⏳ Waiting for Application to Start"
    
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s http://localhost > /dev/null 2>&1; then
            success "Application is responding!"
            break
        fi
        
        if [[ $((attempt % 10)) -eq 0 ]]; then
            log "Attempt $attempt/$max_attempts: Still waiting for application..."
        fi
        
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        warning "Application may still be starting. Check logs with: docker-compose logs"
    fi
}

# Create systemd service for auto-start
create_systemd_service() {
    header "🔄 Creating Auto-Start Service"
    
    log "Creating systemd service..."
    cat > /etc/systemd/system/skyechat.service << EOF
[Unit]
Description=SkyeChat Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
    
    log "Enabling systemd service..."
    systemctl daemon-reload
    systemctl enable skyechat
    
    success "Auto-start service created"
}

# Verify installation
verify_installation() {
    header "✅ Verifying Installation"
    
    # Check Docker
    if systemctl is-active --quiet docker; then
        success "Docker service is running"
    else
        error "Docker service is not running"
        return 1
    fi
    
    # Check containers
    cd "$APP_DIR"
    if docker-compose ps | grep -q "Up"; then
        success "Application containers are running"
    else
        warning "Some containers may not be running"
    fi
    
    # Test connectivity
    if curl -s http://localhost > /dev/null; then
        success "Application is accessible"
    else
        warning "Application may not be fully ready yet"
    fi
    
    # Show container status
    echo ""
    log "Container status:"
    docker-compose ps
}

# Show useful commands
show_management_commands() {
    header "📋 Management Commands"
    
    echo "Application directory: $APP_DIR"
    echo ""
    echo "🔧 Common Commands:"
    echo "  cd $APP_DIR"
    echo "  docker-compose ps                    # Check status"
    echo "  docker-compose logs -f               # View logs"
    echo "  docker-compose restart               # Restart services"
    echo "  docker-compose down                  # Stop services"
    echo "  docker-compose up -d                 # Start services"
    echo "  docker-compose pull && docker-compose up -d --build  # Update app"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  ./quick-diagnostic.sh                # Quick diagnosis"
    echo "  ./fix-nginx-upstream.sh              # Fix connection issues"
    echo "  docker-compose logs skyechat         # App logs"
    echo "  docker-compose logs nginx            # Nginx logs"
    echo ""
    echo "🌐 Access your application:"
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")
    echo "  http://$SERVER_IP"
    echo "  http://localhost (if accessing locally)"
}

# Show completion message
show_completion() {
    header "🎉 Installation Complete!"
    
    echo ""
    echo "Your SkyeChat application has been successfully installed and deployed!"
    echo ""
    success "All services are running"
    success "Firewall is configured"
    success "Auto-start is enabled"
    echo ""
    
    show_management_commands
    
    echo ""
    echo "🔥 Next Steps:"
    echo "1. Test your application in a web browser"
    echo "2. Set up a domain name (optional)"
    echo "3. Configure SSL with Let's Encrypt (for production)"
    echo "4. Monitor logs: docker-compose logs -f"
    echo ""
    warning "Remember to reboot or logout/login to apply docker group permissions for non-root users"
}

# Main installation function
main() {
    clear
    header "🚀 SkyeChat Complete Installation Script"
    header "========================================"
    echo ""
    
    log "Starting installation process..."
    echo ""
    
    detect_os
    check_privileges
    
    update_system
    install_docker
    install_docker_compose
    setup_repository
    create_environment
    setup_firewall
    deploy_application
    wait_for_app
    create_systemd_service
    verify_installation
    
    echo ""
    show_completion
}

# Error handling
trap 'error "Installation failed at line $LINENO"; exit 1' ERR

# Handle script interruption
trap 'error "Installation interrupted"; exit 1' INT TERM

# Run main function
main "$@"
