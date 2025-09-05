# 🚀 EC2 Deployment Guide for NEURALCHAT

## Overview
This guide will help you deploy NEURALCHAT to an AWS EC2 instance with proper configuration, security, and performance optimizations.

## 📋 Prerequisites

### AWS Requirements
- AWS Account with EC2 access
- Key pair for SSH access
- Basic understanding of AWS console

### Local Requirements
- SSH client
- Git installed locally

## 🏗️ Step 1: EC2 Instance Setup

### Launch EC2 Instance
1. **Go to AWS EC2 Console**
2. **Click "Launch Instance"**
3. **Configure Instance:**
   - **Name**: `neuralchat-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free Tier)
   - **Instance Type**: `t2.micro` (Free Tier) or `t3.small` (Recommended)
   - **Key Pair**: Select existing or create new
   - **Storage**: 20 GB gp3 (Recommended)

### Security Group Configuration
Create a new security group with these rules:

| Type | Protocol | Port | Source | Description |
|------|----------|------|---------|-------------|
| SSH | TCP | 22 | Your IP | SSH Access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web Traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure Web |
| Custom TCP | TCP | 5001 | 0.0.0.0/0 | Flask Dev (Optional) |

## 🔧 Step 2: Server Configuration

### Connect to Your Instance
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

### Initial Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y python3 python3-pip python3-venv git nginx certbot python3-certbot-nginx htop curl

# Install Node.js (for any future frontend builds)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📦 Step 3: Application Deployment

### Clone Repository
```bash
# Clone your repository
git clone https://github.com/GyanStore/ERA_v4.git
cd ERA_v4
git checkout gemini-s3
cd Gemini-S3/backprop-visualizer
```

### Python Environment Setup
```bash
# Create virtual environment
python3 -m venv neuralchat_env
source neuralchat_env/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install production server
pip install gunicorn
```

### Environment Variables
```bash
# Create environment file
sudo nano /etc/environment

# Add these lines:
GEMINI_API_KEY="AIzaSyA0arm212nZUmlURuXbbopV4XHWyhGwb5w"
FLASK_ENV="production"
```

## 🌐 Step 4: Web Server Configuration

### Gunicorn Configuration
Create Gunicorn configuration file:
```bash
sudo nano /home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer/gunicorn.conf.py
```

```python
# gunicorn.conf.py
bind = "127.0.0.1:5001"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

### Systemd Service Configuration
Create a systemd service for auto-start:
```bash
sudo nano /etc/systemd/system/neuralchat.service
```

```ini
[Unit]
Description=NEURALCHAT Gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer
Environment="PATH=/home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer/neuralchat_env/bin"
EnvironmentFile=/etc/environment
ExecStart=/home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer/neuralchat_env/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/neuralchat
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files (if needed)
    location /static {
        alias /home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Favicon
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    # Robots.txt
    location = /robots.txt {
        log_not_found off;
        access_log off;
    }
}
```

### Enable and Start Services
```bash
# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/neuralchat /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx

# Enable and start NEURALCHAT service
sudo systemctl daemon-reload
sudo systemctl enable neuralchat
sudo systemctl start neuralchat

# Check status
sudo systemctl status neuralchat
sudo systemctl status nginx
```

## 🔒 Step 5: SSL Certificate (Optional but Recommended)

### Using Let's Encrypt
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🔧 Step 6: Monitoring and Maintenance

### Log Files
```bash
# Application logs
sudo journalctl -u neuralchat -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Performance Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check system resources
htop
df -h
free -h
```

### Backup Script
```bash
# Create backup script
sudo nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
# NEURALCHAT Backup Script

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/neuralchat_$DATE.tar.gz /home/ubuntu/ERA_v4/Gemini-S3/backprop-visualizer

# Keep only last 7 backups
find $BACKUP_DIR -name "neuralchat_*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: neuralchat_$DATE.tar.gz"
```

```bash
chmod +x /home/ubuntu/backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## 🚀 Step 7: Application Updates

### Update Deployment Script
```bash
# Create update script
nano /home/ubuntu/update_neuralchat.sh
```

```bash
#!/bin/bash
# NEURALCHAT Update Script

cd /home/ubuntu/ERA_v4
git pull origin gemini-s3

cd Gemini-S3/backprop-visualizer
source neuralchat_env/bin/activate
pip install -r requirements.txt

sudo systemctl restart neuralchat
sudo systemctl reload nginx

echo "NEURALCHAT updated successfully!"
```

```bash
chmod +x /home/ubuntu/update_neuralchat.sh
```

## 🔍 Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   sudo journalctl -u neuralchat -n 50
   ```

2. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   ```

3. **Permission issues**
   ```bash
   sudo chown -R ubuntu:www-data /home/ubuntu/ERA_v4
   sudo chmod -R 755 /home/ubuntu/ERA_v4
   ```

4. **Port conflicts**
   ```bash
   sudo netstat -tulpn | grep :5001
   sudo lsof -i :5001
   ```

## 📊 Performance Optimization

### System Optimizations
```bash
# Optimize system limits
sudo nano /etc/security/limits.conf
# Add:
# ubuntu soft nofile 65536
# ubuntu hard nofile 65536

# Optimize kernel parameters
sudo nano /etc/sysctl.conf
# Add:
# net.core.somaxconn = 1024
# net.ipv4.tcp_max_syn_backlog = 2048

# Apply changes
sudo sysctl -p
```

### Application Monitoring
```bash
# Install monitoring dashboard (optional)
pip install flask-monitoring-dashboard

# Add to app.py:
# import flask_monitoring_dashboard as dashboard
# dashboard.bind(app)
```

## 🌍 Domain Configuration

### DNS Settings
If using a custom domain:
1. Point A record to your EC2 public IP
2. Add CNAME for www subdomain
3. Wait for DNS propagation (up to 48 hours)

### Elastic IP (Recommended)
1. Allocate Elastic IP in AWS Console
2. Associate with your EC2 instance
3. Update DNS records to use Elastic IP

## 💰 Cost Optimization

### Free Tier Usage
- t2.micro instance (750 hours/month free)
- 30 GB EBS storage (free)
- 15 GB data transfer out (free)

### Monitoring Costs
- Set up billing alerts in AWS Console
- Monitor usage in Cost Explorer
- Consider Reserved Instances for long-term use

## 🎯 Final Checklist

- [ ] EC2 instance launched and configured
- [ ] Security groups properly configured
- [ ] Application deployed and running
- [ ] Nginx configured and SSL enabled
- [ ] Systemd service enabled for auto-start
- [ ] Monitoring and logging set up
- [ ] Backup script configured
- [ ] Domain configured (if applicable)
- [ ] Performance optimized
- [ ] Security hardened

## 🔗 Useful Commands

```bash
# Check application status
sudo systemctl status neuralchat

# Restart application
sudo systemctl restart neuralchat

# View logs
sudo journalctl -u neuralchat -f

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep gunicorn
```

---

**Your NEURALCHAT application should now be running on your EC2 instance! 🎉**

Access it at: `http://your-ec2-public-ip` or `https://your-domain.com`
