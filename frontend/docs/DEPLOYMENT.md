# Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying the Qiyal AI application in various environments.

## Prerequisites

### System Requirements
- Node.js 18.0 or higher
- Docker (for containerized deployment)
- Git
- Minimum 2GB RAM
- At least 10GB free disk space

### Required Environment Variables
```env
NODE_ENV=production
PORT=3000
API_URL=your_api_endpoint
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

## Deployment Options

### 1. Local Development Deployment

```bash
# Clone the repository
git clone https://github.com/vashsempai/qiyal-ai.git
cd qiyal-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### 2. Production Deployment

#### Build for Production
```bash
# Install dependencies
npm ci --only=production

# Build the application
npm run build

# Start production server
npm start
```

#### Using PM2 (Recommended for Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "qiyal-ai" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Docker Deployment

#### Build Docker Image
```bash
# Build the image
docker build -t qiyal-ai .

# Run the container
docker run -d \
  --name qiyal-ai-app \
  -p 3000:3000 \
  --env-file .env \
  qiyal-ai
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

### 4. Cloud Deployment

#### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku login

# Create Heroku app
heroku create qiyal-ai-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set API_URL=your_api_endpoint
# ... other environment variables

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure build and run commands:
   - Build: `npm ci && npm run build`
   - Run: `npm start`
3. Set environment variables
4. Deploy

## SSL/HTTPS Setup

### Using Let's Encrypt with Nginx
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Setup

### MongoDB
```bash
# Install MongoDB
sudo apt install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use qiyal_ai
> db.createUser({
    user: "qiyal_user",
    pwd: "secure_password",
    roles: ["readWrite"]
  })
```

### PostgreSQL
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE qiyal_ai;
CREATE USER qiyal_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE qiyal_ai TO qiyal_user;
```

## Monitoring and Logging

### Application Monitoring
```bash
# Using PM2 monitoring
pm2 monit

# View logs
pm2 logs qiyal-ai

# Restart application
pm2 restart qiyal-ai
```

### Log Configuration
Create `winston.config.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## Security Considerations

### Environment Security
- Never commit `.env` files to version control
- Use strong, unique passwords for all services
- Regularly update dependencies: `npm audit fix`
- Implement rate limiting
- Use HTTPS in production
- Validate and sanitize all inputs

### Firewall Configuration
```bash
# Ubuntu UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --db qiyal_ai --out /backup/mongodb/

# PostgreSQL backup
pg_dump -U qiyal_user -h localhost qiyal_ai > /backup/qiyal_ai_backup.sql
```

### Application Backup
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backup/qiyal-ai/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app.tar.gz /path/to/qiyal-ai

# Backup database
pg_dump -U qiyal_user qiyal_ai > $BACKUP_DIR/database.sql

# Remove old backups (keep last 7 days)
find /backup/qiyal-ai -type d -mtime +7 -exec rm -rf {} +
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **Permission denied errors**
   ```bash
   # Fix file permissions
   chmod +x scripts/deploy.sh
   # Fix directory permissions
   chmod 755 /path/to/qiyal-ai
   ```

3. **Database connection issues**
   - Check database service status
   - Verify connection credentials
   - Ensure database server is accessible

4. **Memory issues**
   ```bash
   # Check memory usage
   free -h
   # Monitor application memory
   pm2 monit
   ```

### Health Check Endpoint
Implement a health check endpoint:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## Scaling

### Horizontal Scaling
```bash
# Run multiple instances with PM2
pm2 start app.js -i max

# Or specify number of instances
pm2 start app.js -i 4
```

### Load Balancer Configuration (Nginx)
```nginx
upstream qiyal_ai {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    location / {
        proxy_pass http://qiyal_ai;
    }
}
```

## Maintenance

### Regular Maintenance Tasks
1. Update dependencies monthly
2. Monitor disk space and clean logs
3. Review security updates
4. Test backup and restore procedures
5. Monitor application performance
6. Review and rotate API keys

### Automated Updates
```bash
# Create update script
#!/bin/bash
cd /path/to/qiyal-ai
git pull origin main
npm ci
npm run build
pm2 restart qiyal-ai
```

## Support

For deployment issues or questions:
- Check the troubleshooting section above
- Review application logs: `pm2 logs qiyal-ai`
- Contact: [support@qiyal-ai.com](mailto:support@qiyal-ai.com)
- GitHub Issues: [https://github.com/vashsempai/qiyal-ai/issues](https://github.com/vashsempai/qiyal-ai/issues)

---

*Last updated: September 2025*
