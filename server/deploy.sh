#!/bin/bash

# OpenSCAD API Server Deployment Script
# Run this script on the server after copying files
# Usage: bash deploy.sh

set -e  # Exit on any error

echo "🚀 Starting OpenSCAD API Server deployment..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if npm is available and get its path
NPM_PATH=$(which npm)
if [ -z "$NPM_PATH" ]; then
    echo "❌ Error: npm not found in PATH"
    exit 1
fi
echo "✅ Found npm at: $NPM_PATH"

# Read API key from .env file
API_KEY=$(grep "API_KEY" .env | cut -d'=' -f2 | tr -d '"')

if [ -z "$API_KEY" ]; then
    echo "❌ Error: Could not find API_KEY in .env file"
    exit 1
fi

echo "✅ Found API key in .env file"

# Update systemd service file with correct npm path and environment
echo "🔧 Updating systemd service file with correct npm path and environment..."
sed -i "s|ExecStart=.*|ExecStart=$NPM_PATH run start|" openscad-api.service

# Add PATH environment variable to systemd service
if ! grep -q "Environment=PATH=" openscad-api.service; then
    sed -i "/Environment=NODE_ENV=production/a Environment=PATH=$PATH" openscad-api.service
fi
echo "✅ Updated systemd service file with PATH"

# Test health endpoint
echo "📡 Testing health endpoint..."
curl -s http://localhost:3001/health && echo "✅ Health check passed" || echo "❌ Health check failed (this is expected if service not running yet)"

# Test SCAD conversion
echo "🧪 Testing SCAD conversion..."
curl -X POST http://localhost:3001/api/convert-scad \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"scadContent": "sphere(r = 1);"}' \
  --max-time 30 \
  | head -c 200 && echo "... ✅ Test request sent" || echo "❌ Conversion test failed (expected if server not running)"

echo "⚙️ Setting up systemd services..."

# Copy systemd service files
sudo cp openscad-api.service /etc/systemd/system/
sudo cp openscad-api-restart.service /etc/systemd/system/
sudo cp openscad-api-restart.timer /etc/systemd/system/

echo "✅ Systemd service files copied"

# Reload systemd
sudo systemctl daemon-reload
echo "✅ Systemd daemon reloaded"

# Enable services
sudo systemctl enable openscad-api.service
sudo systemctl enable openscad-api-restart.timer
echo "✅ Services enabled"

# Start the main service
sudo systemctl start openscad-api.service
echo "✅ OpenSCAD API service started"

# Wait a moment for service to start
sleep 3

# Check service status
echo "📊 Service status:"
sudo systemctl status openscad-api.service --no-pager -l

# If service failed, show logs
if ! sudo systemctl is-active --quiet openscad-api.service; then
    echo "❌ Service is not running. Checking logs:"
    sudo journalctl -u openscad-api.service -n 10 --no-pager
    echo ""
    echo "🔧 Try fixing the issue and restart with:"
    echo "   sudo systemctl restart openscad-api.service"
    exit 1
fi

# Test endpoints again
echo "📡 Testing health endpoint after service start..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    echo "🔧 Check service logs: sudo journalctl -u openscad-api.service -f"
    exit 1
fi

echo "🧪 Testing SCAD conversion after service start..."
CONVERSION_RESULT=$(curl -s -X POST http://localhost:3001/api/convert-scad \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"scadContent": "sphere(r = 1);"}' \
  --max-time 30)

if echo "$CONVERSION_RESULT" | grep -q "success.*true"; then
    echo "✅ Conversion test passed!"
else
    echo "❌ Conversion test failed!"
    echo "Response: $(echo "$CONVERSION_RESULT" | head -c 200)..."
fi

echo "🎉 Deployment complete!"
echo ""
echo "📋 Service commands:"
echo "  Status: sudo systemctl status openscad-api.service"
echo "  Logs:   sudo journalctl -u openscad-api.service -f"
echo "  Stop:   sudo systemctl stop openscad-api.service"
echo "  Start:  sudo systemctl start openscad-api.service"
echo ""
echo "🌐 Endpoints:"
echo "  Health: http://$(hostname -I | awk '{print $1}'):3001/health"
echo "  API:    http://$(hostname -I | awk '{print $1}'):3001/api/convert-scad"