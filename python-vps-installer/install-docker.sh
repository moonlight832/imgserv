#!/bin/bash

# Docker-based VPS Installation Script for SkyeChat
# This script installs Docker and deploys SkyeChat using containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
REPO_URL="https://github.com/moonlight832/imgserv.git"
CONVEX_DEPLOYMENT="https://aware-caiman-68.convex.cloud"
CONVEX_AUTH_SECRET="project:NobleSkye:my-project-chef-ca7e4|eyJ2MiI6IjY1NmNlNzFmOWM5YzQzOTM5ZmE3NWRjZjEwYzcxNDk3In0="
DOMAIN=""  # Optional: your domain name

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Update system
update_system() {
    print_info "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated"
}

# Install Docker
install_docker() {
    print_info "Installing Docker..."
    
    # Remove old versions
    apt remove -y docker docker-engine docker.io containerd runc || true
    
    # Install dependencies
    apt install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [[ $SUDO_USER ]]; then
        usermod -aG docker $SUDO_USER
        print_info "User $SUDO_USER added to docker group"
    fi
    
    print_success "Docker installed successfully"
}

# Install Docker Compose standalone
install_docker_compose() {
    print_info "Installing Docker Compose..."
    
    # Download and install Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed"
}

# Clone repository
clone_repo() {
    print_info "Cloning repository..."
    
    APP_DIR="/opt/skyechat"
    
    # Remove existing directory
    if [[ -d "$APP_DIR" ]]; then
        print_warning "Removing existing directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Clone repository
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    
    print_success "Repository cloned to $APP_DIR"
}

# Create environment file
create_env_file() {
    print_info "Creating environment configuration..."
    
    cat > .env << EOF
# Environment configuration for SkyeChat
CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
CONVEX_AUTH_SECRET=${CONVEX_AUTH_SECRET}
NODE_ENV=production
PORT=3000
DOMAIN=${DOMAIN}
EOF
    
    print_success "Environment file created"
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    
    # Install UFW if not present
    apt install -y ufw
    
    # Configure firewall rules
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    print_success "Firewall configured"
}

# Deploy application
deploy_app() {
    print_info "Deploying application with Docker..."
    
    # Make deploy script executable
    chmod +x deploy.sh
    
    # Deploy the application
    ./deploy.sh deploy
    
    print_success "Application deployed"
}

# Create systemd service for auto-start
create_systemd_service() {
    print_info "Creating systemd service for auto-start..."
    
    cat > /etc/systemd/system/skyechat-docker.service << EOF
[Unit]
Description=SkyeChat Docker Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/skyechat
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable the service
    systemctl daemon-reload
    systemctl enable skyechat-docker
    
    print_success "Systemd service created and enabled"
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    # Check Docker status
    if systemctl is-active --quiet docker; then
        print_success "Docker is running"
    else
        print_error "Docker is not running"
        return 1
    fi
    
    # Check containers
    cd /opt/skyechat
    if docker-compose ps | grep -q "Up"; then
        print_success "Application containers are running"
    else
        print_warning "Application containers may not be running properly"
    fi
    
    # Test HTTP connection
    sleep 10  # Give the app time to start
    if curl -s http://localhost > /dev/null; then
        print_success "HTTP connection test passed"
    else
        print_warning "HTTP connection test failed - application may still be starting"
    fi
}

# Show completion message
show_completion() {
    echo ""
    echo "🎉 Docker deployment completed successfully!"
    echo ""
    echo "Your SkyeChat application should be available at:"
    echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
    if [[ -n "$DOMAIN" ]]; then
        echo "  http://$DOMAIN"
    fi
    echo ""
    echo "📋 Container Management:"
    echo "  cd /opt/skyechat"
    echo "  ./deploy.sh status    # Check status"
    echo "  ./deploy.sh logs      # View logs"
    echo "  ./deploy.sh restart   # Restart services"
    echo "  ./deploy.sh stop      # Stop services"
    echo "  ./deploy.sh update    # Update application"
    echo ""
    echo "🔧 System Commands:"
    echo "  docker ps                              # List running containers"
    echo "  docker-compose -f /opt/skyechat/docker-compose.yml logs -f  # View logs"
    echo "  systemctl status skyechat-docker       # Check systemd service"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Set up SSL certificate with Let's Encrypt (if using a domain)"
    echo "2. Configure your domain's DNS to point to this server"
    echo "3. Update Convex settings if needed in /opt/skyechat/.env"
    echo "4. Monitor logs: ./deploy.sh logs"
}

# Main installation function
main() {
    echo "🐳 SkyeChat Docker VPS Installer"
    echo "================================="
    echo ""
    
    # Check configuration
    if [[ -z "$REPO_URL" ]] || [[ "$REPO_URL" == "https://github.com/yourusername/SkyeChatv2.git" ]]; then
        print_error "Please update REPO_URL in the script with your actual repository URL"
        exit 1
    fi
    
    if [[ -z "$CONVEX_DEPLOYMENT" ]] || [[ -z "$CONVEX_AUTH_SECRET" ]]; then
        print_warning "CONVEX_DEPLOYMENT and CONVEX_AUTH_SECRET should be configured"
        print_warning "You can update them later in /opt/skyechat/.env"
    fi
    
    check_root
    update_system
    
    # Install Git if not present
    apt install -y git curl
    
    install_docker
    install_docker_compose
    clone_repo
    create_env_file
    configure_firewall
    deploy_app
    create_systemd_service
    verify_installation
    show_completion
}

# Run main function
main "$@"
