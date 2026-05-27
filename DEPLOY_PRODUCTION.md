# GetLoopX Production Deployment Guide (Linux VPS)

Follow these steps exactly to make your platform live at `api.getloopx.com`.

---

## 1. Initial VPS Setup
Log in to your VPS terminal and run:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git curl -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 Global
sudo npm install pm2 -g
```

## 2. Configure Nginx
Copy the configuration I prepared for you:
```bash
# Create the config file
sudo nano /etc/nginx/sites-available/getloopx
```
*Paste the contents of `deploy/nginx.getloopx.conf` into that file.*

```bash
# Enable the site and test Nginx
sudo ln -s /etc/nginx/sites-available/getloopx /etc/nginx/sites-enabled/
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 3. Setup SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.getloopx.com
```

## 4. Deploy Backend Services
```bash
# Navigate to your project root
cd /var/www/getloopx-core

# Install dependencies for CRM
cd crm-service
npm install --production

# Create Production .env
nano .env
```
*Paste the following into your `.env` on the server:*
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://user:pass@localhost:5432/getloopx_prod
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=https://www.getloopx.com,https://getloopx.com
# Add your real Stripe/Firebase/AWS keys here
```

## 5. Start with PM2
```bash
# From project root
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 6. Vercel Frontend Configuration
In your **Vercel Dashboard** -> **Environment Variables**:
- Set `VITE_API_BASE_URL` to `https://api.getloopx.com`
- Re-deploy the frontend.

---

## Final Verification
1. Open `https://www.getloopx.com` (Should load UI via Vercel).
2. Open `https://api.getloopx.com/health` (Should return UP status from your VPS).
