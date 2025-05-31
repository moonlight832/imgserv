import subprocess
import os
import sys
import shutil
import time
from pathlib import Path
from config.settings import *

class WebAppInstaller:
    def __init__(self):
        self.app_dir = APP_DIR
        self.app_name = APP_NAME
        self.node_version = NODE_VERSION
        
    def log(self, message):
        """Log messages with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def run_command(self, command, check=True, cwd=None):
        """Run shell command with logging"""
        self.log(f"Running: {command}")
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                check=check, 
                capture_output=True, 
                text=True,
                cwd=cwd
            )
            if result.stdout:
                print(result.stdout)
            return result
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {e}")
            if e.stderr:
                print(f"Error: {e.stderr}")
            if check:
                raise
            return e
    
    def install_system_dependencies(self):
        """Install required system packages"""
        self.log("Installing system dependencies...")
        
        # Update package list
        self.run_command("apt update")
        
        # Install required packages
        packages = [
            'git',
            'curl',
            'build-essential',
            'nginx',
            'ufw',
            'software-properties-common',
            'ca-certificates',
            'gnupg',
            'lsb-release'
        ]
        
        package_list = ' '.join(packages)
        self.run_command(f"apt install -y {package_list}")
        
    def install_nodejs(self):
        """Install Node.js using NodeSource repository"""
        self.log(f"Installing Node.js {self.node_version}...")
        
        # Install Node.js using NodeSource setup script
        self.run_command("curl -fsSL https://deb.nodesource.com/setup_22.x | bash -")
        self.run_command("apt-get install -y nodejs")
        
        # Verify installation
        result = self.run_command("node --version")
        self.log(f"Node.js version: {result.stdout.strip()}")
        
        result = self.run_command("npm --version")
        self.log(f"npm version: {result.stdout.strip()}")
        
    def create_system_user(self):
        """Create a dedicated user for the application"""
        self.log(f"Creating system user '{SYSTEM_USER}'...")
        
        # Check if user already exists
        result = self.run_command(f"id {SYSTEM_USER}", check=False)
        if result.returncode != 0:
            self.run_command(f"useradd -r -m -s /bin/bash {SYSTEM_USER}")
            self.log(f"User '{SYSTEM_USER}' created")
        else:
            self.log(f"User '{SYSTEM_USER}' already exists")
    
    def clone_repository(self):
        """Clone the application repository"""
        self.log("Cloning repository...")
        
        # Remove existing directory if it exists
        if os.path.exists(self.app_dir):
            self.log(f"Removing existing directory: {self.app_dir}")
            shutil.rmtree(self.app_dir)
        
        # Create parent directory
        os.makedirs(os.path.dirname(self.app_dir), exist_ok=True)
        
        # Clone repository
        self.run_command(f"git clone {REPO_URL} {self.app_dir}")
        
        # Set ownership
        self.run_command(f"chown -R {SYSTEM_USER}:{SYSTEM_USER} {self.app_dir}")
        
    def install_app_dependencies(self):
        """Install application dependencies"""
        self.log("Installing application dependencies...")
        
        # Change to app directory and install npm dependencies
        self.run_command("npm install", cwd=self.app_dir)
        
    def create_environment_file(self):
        """Create environment configuration file"""
        self.log("Creating environment configuration...")
        
        env_content = f"""# Environment configuration for {APP_NAME}
CONVEX_DEPLOYMENT={CONVEX_DEPLOYMENT}
CONVEX_AUTH_SECRET={CONVEX_AUTH_SECRET}
NODE_ENV=production
PORT={SERVER_PORT}
"""
        
        env_file = os.path.join(self.app_dir, '.env')
        with open(env_file, 'w') as f:
            f.write(env_content)
            
        self.log(f"Environment file created: {env_file}")
        
    def build_application(self):
        """Build the application for production"""
        self.log("Building application...")
        
        self.run_command("npm run build", cwd=self.app_dir)
        
    def configure_systemd(self):
        """Configure systemd service for the application"""
        self.log("Configuring systemd service...")
        
        service_content = f"""[Unit]
Description={APP_NAME} Web Application
After=network.target

[Service]
Type=simple
User={SYSTEM_USER}
WorkingDirectory={self.app_dir}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT={SERVER_PORT}

[Install]
WantedBy=multi-user.target
"""
        
        service_file = f"/etc/systemd/system/{self.app_name}.service"
        with open(service_file, 'w') as f:
            f.write(service_content)
            
        # Reload systemd and enable service
        self.run_command("systemctl daemon-reload")
        self.run_command(f"systemctl enable {self.app_name}")
        
        self.log(f"Systemd service configured: {service_file}")
        
    def configure_nginx(self):
        """Configure Nginx reverse proxy"""
        self.log("Configuring Nginx...")
        
        # Create Nginx configuration
        nginx_config = f"""server {{
    listen {NGINX_PORT};
    server_name {DOMAIN if DOMAIN else '_'};

    location / {{
        proxy_pass http://localhost:{SERVER_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}
}}
"""
        
        nginx_file = f"/etc/nginx/sites-available/{self.app_name}"
        with open(nginx_file, 'w') as f:
            f.write(nginx_config)
            
        # Enable site
        sites_enabled = f"/etc/nginx/sites-enabled/{self.app_name}"
        if os.path.exists(sites_enabled):
            os.remove(sites_enabled)
        os.symlink(nginx_file, sites_enabled)
        
        # Remove default site if it exists
        default_site = "/etc/nginx/sites-enabled/default"
        if os.path.exists(default_site):
            os.remove(default_site)
            
        # Test nginx configuration
        self.run_command("nginx -t")
        
        self.log("Nginx configured")
        
    def configure_firewall(self):
        """Configure UFW firewall"""
        self.log("Configuring firewall...")
        
        # Allow SSH, HTTP, and HTTPS
        self.run_command("ufw allow OpenSSH")
        self.run_command("ufw allow 'Nginx Full'")
        
        # Enable firewall
        self.run_command("ufw --force enable")
        
        self.log("Firewall configured")
        
    def start_services(self):
        """Start all services"""
        self.log("Starting services...")
        
        # Start and enable nginx
        self.run_command("systemctl restart nginx")
        self.run_command("systemctl enable nginx")
        
        # Start application service
        self.run_command(f"systemctl start {self.app_name}")
        
        self.log("Services started")
        
    def verify_installation(self):
        """Verify the installation is working"""
        self.log("Verifying installation...")
        
        # Check service status
        result = self.run_command(f"systemctl is-active {self.app_name}", check=False)
        if result.returncode == 0:
            self.log(f"✅ {self.app_name} service is running")
        else:
            self.log(f"❌ {self.app_name} service is not running")
            
        # Check nginx status
        result = self.run_command("systemctl is-active nginx", check=False)
        if result.returncode == 0:
            self.log("✅ Nginx is running")
        else:
            self.log("❌ Nginx is not running")
            
        # Test HTTP connection
        self.run_command(f"curl -I http://localhost:{NGINX_PORT}", check=False)
        
    def run_full_installation(self):
        """Run the complete installation process"""
        try:
            self.log(f"Starting installation of {APP_NAME}...")
            
            # Check if running as root
            if os.geteuid() != 0:
                self.log("ERROR: This script must be run as root (use sudo)")
                sys.exit(1)
                
            self.install_system_dependencies()
            self.install_nodejs()
            self.create_system_user()
            self.clone_repository()
            self.install_app_dependencies()
            self.create_environment_file()
            self.build_application()
            self.configure_systemd()
            self.configure_nginx()
            self.configure_firewall()
            self.start_services()
            self.verify_installation()
            
            self.log(f"🎉 Installation completed successfully!")
            self.log(f"Your application should be available at: http://localhost:{NGINX_PORT}")
            if DOMAIN:
                self.log(f"Or at: http://{DOMAIN}")
                
        except Exception as e:
            self.log(f"❌ Installation failed: {e}")
            raise