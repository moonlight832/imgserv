#!/bin/bash

# SkyeChat VPS Installation Script
# This script installs and configures SkyeChat on a fresh Ubuntu/Debian VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
REPO_URL="https://github.com/moonlight832/imgserv.git"  # Replace with your actual repo URL
APP_NAME="skyechat"
APP_DIR="/opt/${APP_NAME}"
DOMAIN=""  # Optional: your domain name
CONVEX_DEPLOYMENT="https://aware-caiman-68.convex.cloud"  # Add your Convex deployment URL
CONVEX_AUTH_SECRET="project:NobleSkye:my-project-chef-ca7e4|eyJ2MiI6IjY1NmNlNzFmOWM5YzQzOTM5ZmE3NWRjZjEwYzcxNDk3In0="  # Add your Convex auth secret

# Function to print colored output
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

# Update system packages
update_system() {
    print_info "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated"
}

# Install system dependencies
install_dependencies() {
    print_info "Installing system dependencies..."
    apt install -y \
        git \
        curl \
        build-essential \
        nginx \
        ufw \
        software-properties-common \
        ca-certificates \
        gnupg \
        lsb-release \
        python3 \
        python3-pip
    print_success "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    print_info "Installing Node.js 22.x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_success "Node.js ${NODE_VERSION} and npm ${NPM_VERSION} installed"
}

# Create system user
create_user() {
    print_info "Creating system user 'deploy'..."
    if ! id "deploy" &>/dev/null; then
        useradd -r -m -s /bin/bash deploy
        print_success "User 'deploy' created"
    else
        print_warning "User 'deploy' already exists"
    fi
}

# Clone repository
clone_repo() {
    print_info "Cloning repository..."
    
    if [ -z "$REPO_URL" ]; then
        print_error "REPO_URL is not set. Please update the script with your repository URL."
        exit 1
    fi
    
    # Remove existing directory
    if [ -d "$APP_DIR" ]; then
        print_warning "Removing existing directory: $APP_DIR"
        rm -rf "$APP_DIR"
    fi
    
    # Clone repository
    git clone "$REPO_URL" "$APP_DIR"
    chown -R deploy:deploy "$APP_DIR"
    print_success "Repository cloned"
}

# Install app dependencies
install_app_deps() {
    print_info "Installing application dependencies..."
    cd "$APP_DIR"
    sudo -u deploy npm install
    print_success "Application dependencies installed"
}

# Create environment file
create_env_file() {
    print_info "Creating environment file..."
    
    cat > "$APP_DIR/.env" << EOF
# Environment configuration for SkyeChat
CONVEX_DEPLOYMENT=${CONVEX_DEPLOYMENT}
CONVEX_AUTH_SECRET=${CONVEX_AUTH_SECRET}
NODE_ENV=production
PORT=3000
EOF
    
    chown deploy:deploy "$APP_DIR/.env"
    print_success "Environment file created"
}

# Build application
build_app() {
    print_info "Building application..."
    cd "$APP_DIR"
    sudo -u deploy npm run build
    print_success "Application built"
}

# Configure systemd service
configure_systemd() {
    print_info "Configuring systemd service..."
    
    cat > "/etc/systemd/system/${APP_NAME}.service" << EOF
[Unit]
Description=SkyeChat Web Application
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable "$APP_NAME"
    print_success "Systemd service configured"
}

# Configure Nginx
configure_nginx() {
    print_info "Configuring Nginx..."
    
    SERVER_NAME="_"
    if [ -n "$DOMAIN" ]; then
        SERVER_NAME="$DOMAIN"
    fi
    
    cat > "/etc/nginx/sites-available/${APP_NAME}" << EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    ln -sf "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/"
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    print_success "Nginx configured"
}

# Configure firewall
configure_firewall() {
    print_info "Configuring firewall..."
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
    print_success "Firewall configured"
}

# Start services
start_services() {
    print_info "Starting services..."
    systemctl restart nginx
    systemctl start "$APP_NAME"
    print_success "Services started"
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    # Check if services are running
    if systemctl is-active --quiet "$APP_NAME"; then
        print_success "SkyeChat service is running"
    else
        print_error "SkyeChat service is not running"
        return 1
    fi
    
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
        return 1
    fi
    
    # Test HTTP connection
    if curl -s http://localhost > /dev/null; then
        print_success "HTTP connection test passed"
    else
        print_warning "HTTP connection test failed"
    fi
}

# Show completion message
show_completion() {
    echo ""
    echo "🎉 Installation completed successfully!"
    echo ""
    echo "Your SkyeChat application should be available at:"
    echo "  http://$(curl -s ifconfig.me)"
    if [ -n "$DOMAIN" ]; then
        echo "  http://$DOMAIN"
    fi
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update your DNS records to point to this server"
    echo "2. Configure SSL certificate (recommended: Let's Encrypt)"
    echo "3. Update the Convex environment variables in $APP_DIR/.env"
    echo "4. Check logs with: sudo journalctl -u $APP_NAME -f"
    echo "5. Restart service with: sudo systemctl restart $APP_NAME"
    echo ""
    echo "🔧 Useful commands:"
    echo "  - Check app status: sudo systemctl status $APP_NAME"
    echo "  - Check app logs: sudo journalctl -u $APP_NAME -f"
    echo "  - Check nginx status: sudo systemctl status nginx"
    echo "  - Check nginx logs: sudo tail -f /var/log/nginx/error.log"
}

# Main installation function
main() {
    echo "🚀 SkyeChat VPS Installer"
    echo "========================="
    echo ""
    
    # Check configuration
    if [ -z "$REPO_URL" ] || [ "$REPO_URL" = "https://github.com/yourusername/SkyeChatv2.git" ]; then
        print_error "Please update REPO_URL in the script with your actual repository URL"
        exit 1
    fi
    
    if [ -z "$CONVEX_DEPLOYMENT" ] || [ -z "$CONVEX_AUTH_SECRET" ]; then
        print_warning "CONVEX_DEPLOYMENT and CONVEX_AUTH_SECRET are not set"
        print_warning "You'll need to update the .env file after installation"
    fi
    
    check_root
    update_system
    install_dependencies
    install_nodejs
    create_user
    clone_repo
    install_app_deps
    create_env_file
    build_app
    configure_systemd
    configure_nginx
    configure_firewall
    start_services
    verify_installation
    show_completion
}

# Run main function
main "$@"
