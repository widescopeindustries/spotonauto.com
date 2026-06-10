#!/bin/bash
# Deploy updated profiles and site to VPS
set -e

echo "=== Deploying AllOEMManuals profiles ==="

# 1. Sync profiles to VPS
echo "Syncing profiles..."
rsync -avz src/data/vehicle-repair-profiles.json root@116.202.210.109:/root/spotonauto.com/src/data/

# 2. Sync repair page
echo "Syncing repair page..."
rsync -avz src/app/repair/'[year]/[make]/[model]/[task]'/page.tsx root@116.202.210.109:/root/spotonauto.com/src/app/repair/'[year]/[make]/[model]/[task]'/

# 3. Sync lib files
echo "Syncing lib files..."
rsync -avz src/lib/vehicleRepairProfiles.ts root@116.202.210.109:/root/spotonauto.com/src/lib/

# 4. Build on VPS
echo "Building on VPS..."
ssh -i ~/.ssh/id_ed25519 root@116.202.210.109 'cd /root/spotonauto.com && npm run build 2>&1 | tail -20'

# 5. Restart Next.js server
echo "Restarting server..."
ssh -i ~/.ssh/id_ed25519 root@116.202.210.109 'systemctl restart spotonauto || pm2 restart spotonauto || (pkill -f "next start" && sleep 2 && cd /root/spotonauto.com && nohup npm run start:web > /tmp/spotonauto.log 2>&1 &)' 

echo "=== Deploy complete ==="
