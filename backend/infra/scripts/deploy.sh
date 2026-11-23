#!/usr/bin/env bash
# deploy.sh — Run once on EC2 to set up Nginx + systemd for Docket
# Usage: bash infra/scripts/deploy.sh

set -e

APP_DIR="/home/ubuntu/Docket---Document-Management-System"

echo "==> Installing Nginx..."
sudo apt-get update -q
sudo apt-get install -y nginx

echo "==> Configuring Nginx..."
sudo cp "$APP_DIR/infra/nginx/docket.conf" /etc/nginx/sites-available/docket
sudo ln -sf /etc/nginx/sites-available/docket /etc/nginx/sites-enabled/docket
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> Installing systemd service..."
sudo cp "$APP_DIR/infra/systemd/docket.service" /etc/systemd/system/docket.service
sudo systemctl daemon-reload
sudo systemctl enable docket
sudo systemctl restart docket

echo "==> Checking status..."
sudo systemctl status docket --no-pager
sudo systemctl status nginx --no-pager

echo ""
echo "✓ Docket is running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
