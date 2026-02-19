#!/bin/bash

# Ubuntu Setup Script for SpotOnAuto + charm.li
# Run this after fresh Ubuntu install

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "==================================="
echo "  SpotOnAuto + charm.li Setup"
echo "  Gangster AI Mechanic Edition"
echo "==================================="
echo -e "${NC}"

CHARM_DIR="$HOME/charm-li-server"
APP_DIR="$HOME/spotonauto-app"

# Function to print status
status() {
    echo -e "${YELLOW}[*] $1${NC}"
}

success() {
    echo -e "${GREEN}[✓] $1${NC}"
}

error() {
    echo -e "${RED}[✗] $1${NC}"
}

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    error "This script is designed for Ubuntu"
    exit 1
fi

status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
success "System updated"

status "Installing dependencies..."
sudo apt install -y \
    git \
    curl \
    wget \
    nodejs \
    npm \
    squashfs-tools \
    build-essential \
    python3 \
    python3-pip \
    vim \
    htop

success "Dependencies installed"

# Install newer Node.js version
status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
success "Node.js $(node --version) installed"

# Setup charm.li directory
status "Setting up charm.li server directory..."
mkdir -p "$CHARM_DIR"
cd "$CHARM_DIR"

if [ -d ".git" ]; then
    status "Updating charm.li repository..."
    git pull origin main
else
    status "Cloning charm.li repository..."
    git clone https://github.com/rOzzy1987/charm.li.git .
fi

success "charm.li repository ready"

# Install charm.li dependencies
status "Installing charm.li dependencies..."
npm install
success "Dependencies installed"

# Check for database file
status "Checking for lmdb-pages.sqsh..."
echo ""
echo -e "${YELLOW}IMPORTANT: You need the 700GB charm.li database file${NC}"
echo ""
echo "Options:"
echo "1. Place lmdb-pages.sqsh in: $CHARM_DIR"
echo "2. Symlink from external drive: ln -s /media/yourdrive/lmdb-pages.sqsh $CHARM_DIR/"
echo "3. Download/build it (takes time)"
echo ""

if [ ! -f "lmdb-pages.sqsh" ]; then
    error "lmdb-pages.sqsh not found!"
    echo ""
    read -p "Do you have the database file elsewhere? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter full path to lmdb-pages.sqsh: " DB_PATH
        if [ -f "$DB_PATH" ]; then
            ln -s "$DB_PATH" "$CHARM_DIR/lmdb-pages.sqsh"
            success "Database linked"
        else
            error "File not found at $DB_PATH"
            exit 1
        fi
    else
        echo "Please obtain the database file and re-run this script"
        exit 1
    fi
fi

FILE_SIZE=$(du -h lmdb-pages.sqsh 2>/dev/null | cut -f1 || echo "unknown")
success "Database found ($FILE_SIZE)"

# Create mount point and mount
status "Creating mount point..."
mkdir -p ./lmdb-pages

if mountpoint -q ./lmdb-pages; then
    status "Already mounted, unmounting..."
    sudo umount ./lmdb-pages
fi

status "Mounting database (requires sudo)..."
sudo mount -o loop -t squashfs ./lmdb-pages.sqsh ./lmdb-pages
success "Database mounted at $CHARM_DIR/lmdb-pages"

# Create convenience scripts
status "Creating convenience scripts..."

# Start script
cat > "$CHARM_DIR/start-charm-li.sh" <<'EOF'
#!/bin/bash
cd ~/charm-li-server
if ! mountpoint -q ./lmdb-pages; then
    echo "Mounting database..."
    sudo mount -o loop -t squashfs ./lmdb-pages.sqsh ./lmdb-pages
fi
echo "Starting charm.li server on http://localhost:8080"
npm start / 8080
EOF
chmod +x "$CHARM_DIR/start-charm-li.sh"

# Stop script
cat > "$CHARM_DIR/stop-charm-li.sh" <<'EOF'
#!/bin/bash
cd ~/charm-li-server
echo "Stopping charm.li server..."
pkill -f "node.*charm-li" || true
echo "Unmounting database..."
sudo umount ./lmdb-pages 2>/dev/null || true
echo "Done"
EOF
chmod +x "$CHARM_DIR/stop-charm-li.sh"

# Status script
cat > "$CHARM_DIR/status-charm-li.sh" <<'EOF'
#!/bin/bash
cd ~/charm-li-server
echo "=== charm.li Server Status ==="
echo ""
echo "Database mounted:"
if mountpoint -q ./lmdb-pages; then
    echo "  ✓ Yes"
else
    echo "  ✗ No"
fi
echo ""
echo "Server running:"
if pgrep -f "node.*charm-li" > /dev/null; then
    echo "  ✓ Yes"
    echo "  PID: $(pgrep -f "node.*charm-li")"
else
    echo "  ✗ No"
fi
echo ""
echo "Test URL: http://localhost:8080"
EOF
chmod +x "$CHARM_DIR/status-charm-li.sh"

success "Scripts created"

# Add aliases to .bashrc
status "Adding command aliases..."

if ! grep -q "charm-li-start" ~/.bashrc; then
    cat >> ~/.bashrc <<'EOF'

# SpotOnAuto charm.li aliases
alias charm-li-start='~/charm-li-server/start-charm-li.sh'
alias charm-li-stop='~/charm-li-server/stop-charm-li.sh'
alias charm-li-status='~/charm-li-server/status-charm-li.sh'
EOF
fi

success "Aliases added"

# Setup SpotOnAuto app directory
status "Setting up SpotOnAuto app directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Create a placeholder for the app
cat > "$APP_DIR/README.md" <<EOF
# SpotOnAuto App

Your Next.js app goes here.

## Quick Start

1. Clone your repo:
   git clone https://github.com/yourusername/spotonauto.com.git .

2. Install dependencies:
   npm install

3. Set up environment:
   cp .env.local.example .env.local
   # Edit .env.local with your API keys

4. Run dev server:
   npm run dev

5. Open http://localhost:3000

## charm.li Server

The charm.li server should be running on http://localhost:8080

Commands:
- charm-li-start   # Start the server
- charm-li-stop    # Stop the server  
- charm-li-status  # Check status
EOF

success "App directory ready"

# Create systemd services
status "Creating systemd services..."

# charm-li mount service
sudo tee /etc/systemd/system/charm-li-mount.service > /dev/null <<EOF
[Unit]
Description=Mount charm.li LMDB database
After=local-fs.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=$USER
WorkingDirectory=$CHARM_DIR
ExecStart=/bin/mount -o loop -t squashfs $CHARM_DIR/lmdb-pages.sqsh $CHARM_DIR/lmdb-pages
ExecStop=/bin/umount $CHARM_DIR/lmdb-pages

[Install]
WantedBy=multi-user.target
EOF

# charm-li server service
sudo tee /etc/systemd/system/charm-li-server.service > /dev/null <<EOF
[Unit]
Description=Charm.li Auto Repair Database Server
After=charm-li-mount.service network.target
Requires=charm-li-mount.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$CHARM_DIR
ExecStart=/usr/bin/npm start / 8080
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

success "Systemd services created"

# Final instructions
echo ""
echo -e "${GREEN}===================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}===================================${NC}"
echo ""
echo "Quick Commands:"
echo "  charm-li-start   - Start the charm.li server"
echo "  charm-li-stop    - Stop the charm.li server"
echo "  charm-li-status  - Check server status"
echo ""
echo "Manual control:"
echo "  cd ~/charm-li-server"
echo "  ./start-charm-li.sh"
echo ""
echo "Auto-start on boot:"
echo "  sudo systemctl enable charm-li-mount charm-li-server"
echo "  sudo systemctl start charm-li-mount charm-li-server"
echo ""
echo "Next steps:"
echo "1. Place your SpotOnAuto app in: $APP_DIR"
echo "2. Start charm.li: charm-li-start"
echo "3. Test: curl http://localhost:8080"
echo ""
echo -e "${YELLOW}Gangster AI Mechanic mode: ACTIVATED${NC}"
echo ""
