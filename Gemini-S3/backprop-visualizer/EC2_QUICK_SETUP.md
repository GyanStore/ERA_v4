# 🚀 EC2 Quick Setup for NEURALCHAT

## One-Command Deployment

### Step 1: Launch EC2 Instance
1. **AWS Console** → **EC2** → **Launch Instance**
2. **Ubuntu 22.04 LTS** (Free Tier)
3. **t2.micro** or **t3.small**
4. **Security Group**: Allow ports 22, 80, 443
5. **Storage**: 20 GB

### Step 2: Connect and Deploy
```bash
# SSH into your instance
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# Run the deployment script
curl -sSL https://raw.githubusercontent.com/GyanStore/ERA_v4/gemini-s3/Gemini-S3/backprop-visualizer/deploy.sh | bash
```

### Step 3: Access Your App
- **URL**: `http://your-ec2-public-ip`
- **Chat**: Click the green chat icon 💬
- **Examples**: Try XOR, AND, or text learning

## 🔒 Optional: SSL Certificate
```bash
# Add your domain to Nginx config
sudo nano /etc/nginx/sites-available/neuralchat
# Replace server_name _ with your domain

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring
```bash
# Check app status
sudo systemctl status neuralchat

# View logs
sudo journalctl -u neuralchat -f

# Update app
/home/ubuntu/update_neuralchat.sh
```

## 🎯 That's it!
Your NEURALCHAT application with Gemini AI is now live! 🧠💬
