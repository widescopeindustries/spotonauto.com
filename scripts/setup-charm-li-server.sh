#!/bin/bash

# Setup script for charm.li server on Linux
# Run this on your Linux server to set up the 700GB charm.li database

set -e

CHARM_LI_DIR="$HOME/charm-li-server"
APP_DIR="$HOME/spotonauto.com"

echo "🚗 Setting up charm.li server for SpotOnAuto..."
echo "================================================"

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "❌ This script is designed for Linux. Detected: $OSTYPE"
    exit 1
fi

# Check for required tools
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed. Install with: sudo apt install nodejs npm"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed. Install with: sudo apt install git"; exit 1; }

# Check for squashfs support
if ! modprobe squashfs 2>/dev/null; then
    echo "⚠️  SquashFS support may not be available. Install with: sudo apt install squashfs-tools"
fi

# Create charm.li server directory
echo ""
echo "📁 Creating charm.li server directory..."
mkdir -p "$CHARM_LI_DIR"
cd "$CHARM_LI_DIR"

# Clone or update charm.li repository
if [ -d ".git" ]; then
    echo "📥 Updating charm.li repository..."
    git pull origin main
else
    echo "📥 Cloning charm.li repository..."
    git clone https://github.com/rOzzy1987/charm.li.git .
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for lmdb-pages.sqsh
echo ""
echo "🔍 Checking for lmdb-pages.sqsh..."
if [ ! -f "lmdb-pages.sqsh" ]; then
    echo ""
    echo "❌ lmdb-pages.sqsh not found!"
    echo ""
    echo "You need to obtain the 700GB charm.li database. Options:"
    echo ""
    echo "1. DOWNLOAD (if available):"
    echo "   wget [url-to-lmdb-pages.sqsh]"
    echo ""
    echo "2. BUILD FROM SOURCE (takes time):"
    echo "   Follow instructions at: https://github.com/rOzzy1987/charm.li"
    echo ""
    echo "3. MOUNT EXISTING FILE:"
    echo "   If you have the file elsewhere, symlink it:"
    echo "   ln -s /path/to/lmdb-pages.sqsh $CHARM_LI_DIR/lmdb-pages.sqsh"
    echo ""
    exit 1
fi

FILE_SIZE=$(du -h lmdb-pages.sqsh | cut -f1)
echo "✓ Found lmdb-pages.sqsh ($FILE_SIZE)"

# Create mount point and mount
echo ""
echo "💽 Mounting database..."
mkdir -p ./lmdb-pages

if mountpoint -q ./lmdb-pages; then
    echo "Already mounted, unmounting first..."
    sudo umount ./lmdb-pages
fi

sudo mount -o loop -t squashfs ./lmdb-pages.sqsh ./lmdb-pages
echo "✓ Database mounted"

# Create systemd service for auto-start
echo ""
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/charm-li-server.service > /dev/null <<EOF
[Unit]
Description=Charm.li Auto Repair Database Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CHARM_LI_DIR
ExecStart=/usr/bin/node $CHARM_LI_DIR/index.js / 8080
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create mount service
echo "Creating mount service..."
sudo tee /etc/systemd/system/charm-li-mount.service > /dev/null <<EOF
[Unit]
Description=Mount charm.li LMDB database
Before=charm-li-server.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/bin/mount -o loop -t squashfs $CHARM_LI_DIR/lmdb-pages.sqsh $CHARM_LI_DIR/lmdb-pages
ExecStop=/bin/umount $CHARM_LI_DIR/lmdb-pages

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  sudo systemctl start charm-li-mount charm-li-server"
echo ""
echo "To enable auto-start on boot:"
echo "  sudo systemctl enable charm-li-mount charm-li-server"
echo ""
echo "To check status:"
echo "  sudo systemctl status charm-li-server"
echo ""
echo "The server will be available at: http://localhost:8080"
echo ""

# Ask if user wants to start now
read -p "Start the server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting services..."
    sudo systemctl start charm-li-mount
    sleep 2
    sudo systemctl start charm-li-server
    
    echo ""
    echo "Waiting for server to start..."
    sleep 3
    
    if curl -s http://localhost:8080 >/dev/null; then
        echo "✓ Server is running at http://localhost:8080"
        
        # Extract database for the app
        echo ""
        echo "Extracting vehicle database for SpotOnAuto app..."
        cd "$APP_DIR"
        node scripts/extract-charm-li-lmdb.js
        
    else
        echo "⚠️  Server may not have started correctly. Check: sudo systemctl status charm-li-server"
    fi
fi

echo ""
echo "🎉 Done!"
