# SkyeChat Docker Deployment

Complete Docker containerization setup for SkyeChat with production-ready configuration.

## 🐳 What's Included

- **Multi-stage Dockerfile** - Optimized for production
- **Docker Compose** - Full stack with Nginx reverse proxy
- **Automated deployment scripts** - One-command deployment
- **Health checks** - Container monitoring
- **Production configuration** - Nginx, SSL ready, security hardened

## 🚀 Quick Start

### Option 1: Docker VPS Installer (Recommended)

Deploy everything on a fresh VPS with one command:

```bash
# Download and run the Docker installer
curl -fsSL https://raw.githubusercontent.com/yourusername/SkyeChatv2/main/python-vps-installer/install-docker.sh | sudo bash
```

### Option 2: Manual Docker Setup

1. **Prerequisites:**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone and configure:**
   ```bash
   git clone https://github.com/yourusername/SkyeChatv2.git
   cd SkyeChatv2
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh deploy
   ```

## 📋 Configuration

### Environment Variables

Create a `.env` file with:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=https://your-deployment.convex.cloud
CONVEX_AUTH_SECRET=your-auth-secret

# Application Configuration
NODE_ENV=production
PORT=3000

# Domain Configuration (for SSL)
DOMAIN=your-domain.com
```

### Docker Compose Services

- **skyechat** - Main application container
- **nginx** - Reverse proxy and web server

## 🛠️ Container Management

### Using the Deploy Script

```bash
# Deploy application
./deploy.sh deploy

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Update application
./deploy.sh update

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart
```

### Direct Docker Commands

```bash
# Build image
docker build -t skyechat:latest .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Check running containers
docker ps
```

## 🔧 Development

### Local Development with Docker

```bash
# Create development environment
cp .env.example .env.dev

# Run development stack
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Building Custom Images

```bash
# Build with custom tag
docker build -t skyechat:v1.0.0 .

# Build with build args
docker build --build-arg NODE_ENV=development -t skyechat:dev .
```

## 🔒 Security Features

### Container Security
- **Non-root user** - Application runs as `nextjs` user
- **Multi-stage build** - Minimal attack surface
- **Health checks** - Automatic container monitoring
- **Resource limits** - Prevents resource exhaustion

### Network Security
- **Nginx proxy** - Hides application server
- **Rate limiting** - Prevents abuse
- **SSL/TLS ready** - HTTPS configuration included
- **Security headers** - XSS, CSRF protection

## 🌐 Production Deployment

### SSL/HTTPS Setup

1. **With Let's Encrypt:**
   ```bash
   # Install Certbot
   sudo apt install certbot

   # Get certificate
   sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com

   # Update nginx.conf to enable HTTPS server block
   # Restart nginx
   docker-compose restart nginx
   ```

2. **With custom certificates:**
   ```bash
   # Place certificates in ./ssl/ directory
   mkdir ssl
   cp your-cert.pem ssl/cert.pem
   cp your-key.pem ssl/key.pem
   
   # Restart services
   docker-compose restart
   ```

### Scaling

```bash
# Scale application containers
docker-compose up -d --scale skyechat=3

# Use with load balancer
# Update nginx.conf upstream configuration
```

### Backup and Restore

```bash
# Backup application data
docker run --rm -v skyechat_app-data:/data -v $(pwd):/backup alpine tar czf /backup/skyechat-backup.tar.gz /data

# Restore application data
docker run --rm -v skyechat_app-data:/data -v $(pwd):/backup alpine tar xzf /backup/skyechat-backup.tar.gz -C /
```

## 📊 Monitoring

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' skyechat-app

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' skyechat-app
```

### Logs

```bash
# Application logs
docker-compose logs -f skyechat

# Nginx logs
docker-compose logs -f nginx

# System logs
sudo journalctl -u docker -f
```

### Resource Monitoring

```bash
# Container resource usage
docker stats

# Detailed container info
docker inspect skyechat-app
```

## 🔧 Troubleshooting

### Common Issues

1. **Container won't start:**
   ```bash
   docker-compose logs skyechat
   docker inspect skyechat-app
   ```

2. **502 Bad Gateway:**
   ```bash
   # Check if app container is running
   docker-compose ps
   
   # Check application logs
   docker-compose logs skyechat
   ```

3. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R 1001:1001 ./data
   ```

4. **Build failures:**
   ```bash
   # Clean build cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Mode

```bash
# Run container in debug mode
docker run -it --rm skyechat:latest /bin/sh

# Override entrypoint for debugging
docker run -it --rm --entrypoint /bin/sh skyechat:latest
```

## 📈 Performance Optimization

### Image Optimization
- Multi-stage build reduces image size
- Alpine Linux base for minimal footprint
- Production dependencies only

### Runtime Optimization
- Node.js production mode
- Nginx caching and compression
- Health checks for reliability

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  skyechat:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          memory: 256M
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to VPS
        run: |
          ssh user@vps "cd /opt/skyechat && git pull && ./deploy.sh update"
```

### Automated Updates

```bash
# Create update script
cat > update.sh << 'EOF'
#!/bin/bash
cd /opt/skyechat
git pull origin main
./deploy.sh update
EOF

# Add to crontab for daily updates
echo "0 2 * * * /opt/skyechat/update.sh" | sudo crontab -
```

## 📞 Support

For Docker-specific issues:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Verify configuration: `docker-compose config`
4. Test connectivity: `docker-compose exec skyechat curl localhost:3000`

## 📄 License

This Docker configuration is part of the SkyeChat project and follows the same license terms.
