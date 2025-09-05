#!/bin/bash
# NEURALCHAT EC2 Deployment Script

set -e

echo "🚀 NEURALCHAT EC2 Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on Ubuntu
if [[ $(lsb_release -rs) != "22.04" ]]; then
    print_warning "This script is optimized for Ubuntu 22.04"
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
print_status "Installing dependencies..."
sudo apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx htop curl

# Create application directory
APP_DIR="/home/ubuntu/neuralchat"
print_status "Setting up application directory: $APP_DIR"

if [ -d "$APP_DIR" ]; then
    print_warning "Application directory exists. Backing up..."
    sudo mv $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)
fi

# Clone repository
print_status "Cloning NEURALCHAT repository..."
git clone https://github.com/GyanStore/ERA_v4.git $APP_DIR
cd $APP_DIR
git checkout gemini-s3
cd Gemini-S3/backprop-visualizer

# Set up Python environment
print_status "Setting up Python virtual environment..."
python3 -m venv neuralchat_env
source neuralchat_env/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Create Gunicorn configuration
print_status "Creating Gunicorn configuration..."
cat > gunicorn.conf.py << EOF
bind = "127.0.0.1:5001"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
EOF

# Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/neuralchat.service > /dev/null << EOF
[Unit]
Description=NEURALCHAT Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=$APP_DIR/Gemini-S3/backprop-visualizer
Environment="PATH=$APP_DIR/Gemini-S3/backprop-visualizer/neuralchat_env/bin"
Environment="GEMINI_API_KEY=AIzaSyA0arm212nZUmlURuXbbopV4XHWyhGwb5w"
Environment="FLASK_ENV=production"
ExecStart=$APP_DIR/Gemini-S3/backprop-visualizer/neuralchat_env/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/neuralchat > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /static {
        alias $APP_DIR/Gemini-S3/backprop-visualizer/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
print_status "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/neuralchat /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable neuralchat
sudo systemctl start neuralchat
sudo systemctl restart nginx

# Check service status
if sudo systemctl is-active --quiet neuralchat; then
    print_status "NEURALCHAT service is running"
else
    print_error "NEURALCHAT service failed to start"
    sudo journalctl -u neuralchat -n 20
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx service is running"
else
    print_error "Nginx service failed to start"
    exit 1
fi

# Create update script
print_status "Creating update script..."
cat > /home/ubuntu/update_neuralchat.sh << EOF
#!/bin/bash
cd $APP_DIR
git pull origin gemini-s3
cd Gemini-S3/backprop-visualizer
source neuralchat_env/bin/activate
pip install -r requirements.txt
sudo systemctl restart neuralchat
echo "NEURALCHAT updated successfully!"
EOF

chmod +x /home/ubuntu/update_neuralchat.sh

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
print_status "NEURALCHAT is now running on your EC2 instance"
print_status "Access your application at: http://$PUBLIC_IP"
echo ""
echo "📋 Next Steps:"
echo "  1. Configure your domain (if applicable)"
echo "  2. Set up SSL certificate: sudo certbot --nginx"
echo "  3. Update security groups if needed"
echo "  4. Monitor logs: sudo journalctl -u neuralchat -f"
echo ""
echo "🔧 Management Commands:"
echo "  • Restart app: sudo systemctl restart neuralchat"
echo "  • View logs: sudo journalctl -u neuralchat -f"
echo "  • Update app: /home/ubuntu/update_neuralchat.sh"
echo ""
print_status "Happy learning with NEURALCHAT! 🧠💬"
