#!/bin/bash

# DeFi Exchange - Auto Deploy Script for Render

echo "🚀 DeFi Exchange - Auto Deploy Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All requirements are met!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd src
    npm install
    cd ..
    
    # Install bot dependencies
    cd telegram-bot
    npm install
    cd ..
    
    print_success "Dependencies installed successfully!"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd src
    npm run build
    cd ..
    
    if [ -d "src/build" ]; then
        print_success "Frontend built successfully!"
    else
        print_error "Frontend build failed!"
        exit 1
    fi
}

# Test the application
test_application() {
    print_status "Testing application..."
    
    # Test if all files exist
    if [ ! -f "admin-server.js" ]; then
        print_error "admin-server.js not found!"
        exit 1
    fi
    
    if [ ! -f "telegram-bot/bot.js" ]; then
        print_error "telegram-bot/bot.js not found!"
        exit 1
    fi
    
    if [ ! -d "src/build" ]; then
        print_error "Frontend build directory not found!"
        exit 1
    fi
    
    print_success "Application test passed!"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment
    
    # Copy necessary files
    cp -r src/build deployment/public
    cp admin-server.js deployment/
    cp package*.json deployment/
    cp -r contracts deployment/
    cp -r telegram-bot deployment/
    
    # Create database directory
    mkdir -p deployment/database
    
    print_success "Deployment package created!"
}

# Deploy to Render (if render CLI is available)
deploy_to_render() {
    print_status "Checking for Render CLI..."
    
    if command -v render &> /dev/null; then
        print_status "Deploying to Render..."
        render deploy
        print_success "Deployed to Render successfully!"
    else
        print_warning "Render CLI not found. Please deploy manually using the web interface."
        print_status "Go to: https://dashboard.render.com"
    fi
}

# Main deployment function
main() {
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    check_requirements
    install_dependencies
    build_frontend
    test_application
    create_deployment_package
    deploy_to_render
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your repository to Render"
    echo "3. Set up environment variables"
    echo "4. Deploy your services"
    echo ""
    print_status "For detailed instructions, see: RENDER_DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@"
