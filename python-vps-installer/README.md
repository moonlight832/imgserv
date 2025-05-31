# SkyeChat VPS Installer

Automated installer for deploying SkyeChat web application on a VPS server.

## Features

- 🚀 **One-click installation** - Complete setup with a single command
- 🔧 **Automated configuration** - Sets up Node.js, Nginx, and systemd services
- 🔒 **Security hardening** - Configures firewall and creates dedicated user
- 📊 **Production ready** - Optimized for production deployment
- 🔍 **Verification** - Automatically tests the installation

## Quick Start

### Method 1: Bash Script (Recommended)

1. **Download and run the installer:**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/yourusername/SkyeChatv2/main/python-vps-installer/install.sh | sudo bash
   ```

   Or download and customize first:
   ```bash
   wget https://raw.githubusercontent.com/yourusername/SkyeChatv2/main/python-vps-installer/install.sh
   sudo chmod +x install.sh
   # Edit the script to update REPO_URL and Convex credentials
   sudo ./install.sh
   ```

### Method 2: Python Installer

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/SkyeChatv2.git
   cd SkyeChatv2/python-vps-installer
   ```

2. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Configure settings:**
   Edit `src/config/settings.py` and update:
   - `REPO_URL` - Your repository URL
   - `CONVEX_DEPLOYMENT` - Your Convex deployment URL
   - `CONVEX_AUTH_SECRET` - Your Convex auth secret
   - `DOMAIN` - Your domain name (optional)

4. **Run the installer:**
   ```bash
   sudo python3 src/main.py
   ```

## Prerequisites

- **Operating System:** Ubuntu 20.04+ or Debian 11+
- **Architecture:** x64 (AMD64)
- **RAM:** Minimum 1GB (2GB+ recommended)
- **Storage:** At least 10GB free space
- **Network:** Public IP address with ports 80 and 443 accessible

## What Gets Installed

### System Packages
- **Node.js 22.x** - Latest LTS version
- **npm** - Node package manager
- **Git** - Version control
- **Nginx** - Web server and reverse proxy
- **UFW** - Firewall
- **Build tools** - For compiling native modules

### Application Setup
- **SkyeChat app** - Cloned to `/opt/skyechat`
- **Dependencies** - All npm packages installed
- **Production build** - Optimized for deployment
- **Environment config** - `.env` file with production settings

### Services Configuration
- **Systemd service** - Auto-start and process management
- **Nginx reverse proxy** - Routes traffic to the app
- **Firewall rules** - Secure access (SSH, HTTP, HTTPS)
- **System user** - Dedicated `deploy` user for security

## Configuration

### Before Installation

Update these variables in the installer script:

```bash
# Required - Update these
REPO_URL="https://github.com/yourusername/SkyeChatv2.git"
CONVEX_DEPLOYMENT="your-convex-deployment-url"
CONVEX_AUTH_SECRET="your-convex-auth-secret"

# Optional
DOMAIN="yourdomain.com"  # Your domain name
```

### After Installation

1. **Update environment variables:**
   ```bash
   sudo nano /opt/skyechat/.env
   ```

2. **Restart the service:**
   ```bash
   sudo systemctl restart skyechat
   ```

## Usage

### Service Management

```bash
# Check service status
sudo systemctl status skyechat

# Start/stop/restart service
sudo systemctl start skyechat
sudo systemctl stop skyechat
sudo systemctl restart skyechat

# View logs
sudo journalctl -u skyechat -f

# View last 100 log lines
sudo journalctl -u skyechat -n 100
```

### Nginx Management

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Reload nginx configuration
sudo systemctl reload nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Application Management

```bash
# Navigate to app directory
cd /opt/skyechat

# Update application
sudo -u deploy git pull origin main
sudo -u deploy npm install
sudo -u deploy npm run build
sudo systemctl restart skyechat

# View application files
sudo -u deploy ls -la /opt/skyechat
```

## SSL/HTTPS Setup

For production use, set up SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (replace yourdomain.com)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u skyechat -n 50
   ```

2. **502 Bad Gateway:**
   - Check if the app is running: `sudo systemctl status skyechat`
   - Check app logs: `sudo journalctl -u skyechat -f`
   - Verify port 3000 is listening: `sudo netstat -tlpn | grep 3000`

3. **Permission issues:**
   ```bash
   sudo chown -R deploy:deploy /opt/skyechat
   ```

4. **Build failures:**
   ```bash
   cd /opt/skyechat
   sudo -u deploy npm install
   sudo -u deploy npm run build
   ```

### Log Locations

- **Application logs:** `sudo journalctl -u skyechat`
- **Nginx access logs:** `/var/log/nginx/access.log`
- **Nginx error logs:** `/var/log/nginx/error.log`
- **System logs:** `sudo journalctl -xe`

### Health Checks

```bash
# Check if app responds
curl -I http://localhost

# Check service status
sudo systemctl is-active skyechat
sudo systemctl is-active nginx

# Check listening ports
sudo netstat -tlpn | grep -E ":(80|443|3000)"
```

## Security Considerations

- The installer creates a dedicated `deploy` user with minimal privileges
- UFW firewall is configured to allow only necessary ports
- Nginx is configured with security headers
- The application runs as a non-root user

### Additional Security (Recommended)

1. **Change SSH port:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change Port 22 to a custom port
   sudo systemctl restart ssh
   ```

2. **Disable password authentication:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set PasswordAuthentication no
   sudo systemctl restart ssh
   ```

3. **Install fail2ban:**
   ```bash
   sudo apt install fail2ban
   ```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all prerequisites are met
4. Verify your configuration settings

## License

This installer is part of the SkyeChat project and follows the same license terms.