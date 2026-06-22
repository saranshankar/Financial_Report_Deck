# Production Deployment Guide: FinSight AI

This document details how to take the "FinSight AI" application from a development prototype to a production-ready environment on virtual private servers (such as AWS EC2, DigitalOcean, or Google Cloud VM).

---

## 🔒 1. Production Security Guidelines

### Secret Management
Before deploying, generate secure strings for configuration keys. Do NOT use default credentials in production:
1. **JWT Secret Key**: Run `openssl rand -hex 32` to generate a cryptographically secure 64-character token.
2. **PostgreSQL Database Password**: Modify the default user and password values.

### CORS Settings
Update the allowed origins list in `backend/app/main.py` to match only your production domain name:
```python
origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

---

## 🛠️ 2. Step-by-Step Server Setup

### Prerequisite installations
On a clean Ubuntu 22.04 LTS server, install Docker and git:
```bash
sudo apt update
sudo apt install -y curl git apt-transport-https ca-certificates curl software-properties-common

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu/ $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-compose-plugin
```

---

## 🐳 3. Production Docker Setup

For production, create a `docker-compose.prod.yml` file to handle data persistence securely and disable code-reloads:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: finsight-prod-db
    restart: always
    environment:
      POSTGRES_USER: finsight_admin
      POSTGRES_PASSWORD: secure_db_password_here
      POSTGRES_DB: finsight_prod
    ports:
      - "127.0.0.1:5432:5432" # Bind to localhost to prevent direct external connection
    volumes:
      - pg_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U finsight_admin -d finsight_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: finsight-prod-backend
    restart: always
    environment:
      - DATABASE_URL=postgresql://finsight_admin:secure_db_password_here@db:5432/finsight_prod
      - JWT_SECRET=your_openssl_generated_hex_here
      - GEMINI_API_KEY=your_gemini_api_key
    depends_on:
      db:
        condition: service_healthy
    # Disable uvicorn reload in production Dockerfile or command override
    command: ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: finsight-prod-frontend
    restart: always
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    # Override frontend command for production compilation and start
    command: sh -c "npm run build && npm run start"
    depends_on:
      - backend

volumes:
  pg_prod_data:
```

Launch production containers using the command:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🌐 4. Nginx Reverse Proxy & Let's Encrypt SSL

Install Nginx on the host system to route web traffic to your containers and configure SSL:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Config Nginx Sites
Create `/etc/nginx/sites-available/finsight` and paste:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase max file size upload for statements (PDFs, Images)
        client_max_body_size 10M;
    }
}
```

Enable site config and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/finsight /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Enable SSL certificates
Run Certbot to fetch free Let's Encrypt SSL certifications:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```
Choose option `2` to automatically redirect all HTTP traffic to secure HTTPS.

---

## 💾 5. Database Backups

Create a backup script `/opt/backup_finsight.sh` to prevent data loss:
```bash
#!/bin/bash
BACKUP_DIR="/opt/db_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
docker exec -t finsight-prod-db pg_dump -U finsight_admin finsight_prod > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
# Delete backups older than 14 days
find $BACKUP_DIR -type f -name "*.sql" -mtime +14 -delete
```

Set script execute privileges and configure backup cron task:
```bash
chmod +x /opt/backup_finsight.sh
# Run every night at 2:00 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup_finsight.sh") | crontab -
```
