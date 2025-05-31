#!/bin/bash

# Docker deployment script for SkyeChat
# This script builds and deploys the SkyeChat application using Docker

set -e

# Colors for output
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

# Configuration
APP_NAME="skyechat"
IMAGE_NAME="skyechat:latest"
CONTAINER_NAME="skyechat-app"

echo "🐳 SkyeChat Docker Deployment"
echo "=============================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for .env file
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found. Creating from template..."
    if [[ -f ".env.example" ]]; then
        cp .env.example .env
        print_info "Please edit the .env file with your configuration before continuing."
        print_info "Run: nano .env"
        exit 1
    else
        print_error ".env.example file not found. Please create a .env file with your configuration."
        exit 1
    fi
fi

# Function to build the Docker image
build_image() {
    print_info "Building Docker image..."
    docker build -t "$IMAGE_NAME" .
    print_success "Docker image built successfully"
}

# Function to start services with Docker Compose
start_services() {
    print_info "Starting services with Docker Compose..."
    docker-compose up -d
    print_success "Services started"
}

# Function to stop services
stop_services() {
    print_info "Stopping services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to view logs
view_logs() {
    print_info "Viewing application logs..."
    docker-compose logs -f skyechat
}

# Function to check status
check_status() {
    print_info "Checking service status..."
    docker-compose ps
    
    # Health check
    print_info "Performing health check..."
    if docker-compose exec skyechat curl -f http://localhost:3000/health &>/dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - application may still be starting"
    fi
}

# Function to update application
update_app() {
    print_info "Updating application..."
    
    # Pull latest code (if in git repo)
    if [[ -d ".git" ]]; then
        git pull origin main
    fi
    
    # Rebuild and restart
    docker-compose down
    build_image
    start_services
    
    print_success "Application updated"
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the services"
    echo "  stop      Stop the services"
    echo "  restart   Restart the services"
    echo "  logs      View application logs"
    echo "  status    Check service status"
    echo "  update    Update and restart the application"
    echo "  deploy    Full deployment (build + start)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy    # Build and start services"
    echo "  $0 logs      # View real-time logs"
    echo "  $0 status    # Check if services are running"
}

# Parse command line arguments
case "${1:-}" in
    "build")
        build_image
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        start_services
        ;;
    "logs")
        view_logs
        ;;
    "status")
        check_status
        ;;
    "update")
        update_app
        ;;
    "deploy")
        build_image
        start_services
        sleep 5
        check_status
        echo ""
        print_success "🎉 Deployment complete!"
        echo ""
        echo "Your application should be available at:"
        echo "  http://localhost (if running locally)"
        echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'your-server-ip')"
        echo ""
        echo "Useful commands:"
        echo "  $0 logs      # View logs"
        echo "  $0 status    # Check status"
        echo "  $0 stop      # Stop services"
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        print_error "No command specified."
        show_help
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
