# Windows Production Setup Script
# Run this in an Administrator PowerShell window

Write-Host "Setting up Windows Firewall for CRM Service..." -ForegroundColor Cyan

# 1. Open Port 4000 (API)
New-NetFirewallRule -DisplayName "GetLoopX CRM API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# 2. Install PM2 Windows Service wrapper
Write-Host "Installing PM2 Windows Service tools..." -ForegroundColor Cyan
npm install -g pm2-windows-startup

# 3. Setup auto-startup
Write-Host "Registering PM2 as a Windows Service..." -ForegroundColor Cyan
pm2-startup install

# 4. Save current PM2 state
pm2 save

Write-Host "Windows Production Setup Complete!" -ForegroundColor Green
Write-Host "Your API is allowed on port 4000."
Write-Host "PM2 will now start automatically when Windows boots."
