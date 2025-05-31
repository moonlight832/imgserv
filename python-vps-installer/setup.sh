#!/bin/bash

# Quick setup script for SkyeChat VPS Installer
# This script helps you configure the installer before running it

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo "🚀 SkyeChat VPS Installer Setup"
echo "==============================="
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "This setup script should NOT be run as root"
    print_info "This script is for configuration only. The actual installer needs root."
    exit 1
fi

# Get repository URL
echo -n "Enter your repository URL (e.g., https://github.com/username/SkyeChatv2.git): "
read REPO_URL

if [[ -z "$REPO_URL" ]]; then
    print_error "Repository URL is required"
    exit 1
fi

# Get Convex deployment URL
echo -n "Enter your Convex deployment URL (optional, can be set later): "
read CONVEX_DEPLOYMENT

# Get Convex auth secret
echo -n "Enter your Convex auth secret (optional, can be set later): "
read CONVEX_AUTH_SECRET

# Get domain name
echo -n "Enter your domain name (optional): "
read DOMAIN

# Choose installation method
echo ""
echo "Choose installation method:"
echo "1) Bash script (recommended)"
echo "2) Python installer"
echo -n "Enter choice (1 or 2): "
read CHOICE

case $CHOICE in
    1)
        print_info "Configuring bash installer..."
        
        # Download or copy install.sh
        if [[ -f "install.sh" ]]; then
            cp install.sh install-configured.sh
        else
            print_error "install.sh not found in current directory"
            exit 1
        fi
        
        # Update configuration in the script
        sed -i "s|REPO_URL=\".*\"|REPO_URL=\"$REPO_URL\"|" install-configured.sh
        sed -i "s|CONVEX_DEPLOYMENT=\".*\"|CONVEX_DEPLOYMENT=\"$CONVEX_DEPLOYMENT\"|" install-configured.sh
        sed -i "s|CONVEX_AUTH_SECRET=\".*\"|CONVEX_AUTH_SECRET=\"$CONVEX_AUTH_SECRET\"|" install-configured.sh
        sed -i "s|DOMAIN=\".*\"|DOMAIN=\"$DOMAIN\"|" install-configured.sh
        
        chmod +x install-configured.sh
        
        print_success "Configured installer saved as: install-configured.sh"
        echo ""
        echo "To install on your VPS:"
        echo "1. Copy install-configured.sh to your VPS"
        echo "2. Run: sudo ./install-configured.sh"
        echo ""
        echo "Or upload and run directly:"
        echo "cat install-configured.sh | ssh root@your-vps-ip 'bash'"
        ;;
        
    2)
        print_info "Configuring Python installer..."
        
        # Update settings.py
        if [[ -f "src/config/settings.py" ]]; then
            sed -i "s|REPO_URL = \".*\"|REPO_URL = \"$REPO_URL\"|" src/config/settings.py
            sed -i "s|CONVEX_DEPLOYMENT = \".*\"|CONVEX_DEPLOYMENT = \"$CONVEX_DEPLOYMENT\"|" src/config/settings.py
            sed -i "s|CONVEX_AUTH_SECRET = \".*\"|CONVEX_AUTH_SECRET = \"$CONVEX_AUTH_SECRET\"|" src/config/settings.py
            sed -i "s|DOMAIN = \".*\"|DOMAIN = \"$DOMAIN\"|" src/config/settings.py
            
            print_success "Configuration updated in src/config/settings.py"
            echo ""
            echo "To install on your VPS:"
            echo "1. Copy this entire directory to your VPS"
            echo "2. Run: sudo python3 src/main.py"
        else
            print_error "src/config/settings.py not found"
            exit 1
        fi
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_info "Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Ensure your VPS is running Ubuntu 20.04+ or Debian 11+"
echo "2. Have SSH root access to your VPS"
echo "3. Copy the configured installer to your VPS"
echo "4. Run the installer as root (sudo)"
echo ""
print_warning "Make sure to update your Convex credentials in the .env file after installation!"
