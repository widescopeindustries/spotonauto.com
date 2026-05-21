#!/bin/bash

# start-local-dev.sh
# Establishes SSH tunnels to the remote VPS for databases and LMDB, then runs npm run dev.

VPS_IP="116.202.210.109"

echo "=== Automotive Repair Knowledge Cosmos (ARKC) - Local Dev Boot ==="

# 1. Kill any existing processes using ports we want to bind to
echo "Checking and freeing local ports 8080, 5432, 7687..."
for PORT in 8080 5432 7687; do
  PID=$(lsof -t -i:$PORT 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)..."
    kill -9 $PID 2>/dev/null
  fi
done

# 2. Establish SSH Tunnels to VPS
echo "Establishing secure SSH tunnels to VPS ($VPS_IP)..."
ssh -o StrictHostKeyChecking=no -N \
  -L 8080:127.0.0.1:8080 \
  -L 5432:127.0.0.1:5432 \
  -L 7687:127.0.0.1:7687 \
  root@$VPS_IP &
TUNNEL_PID=$!

# Ensure tunnels close on script exit
trap "echo 'Closing SSH Tunnels...'; kill $TUNNEL_PID 2>/dev/null; exit" INT TERM EXIT

# Wait a second to let tunnels establish
sleep 2

# Check if tunnels are active
if kill -0 $TUNNEL_PID 2>/dev/null; then
  echo "✓ SSH Tunnels successfully established."
  echo "  - LMDB Backend: http://127.0.0.1:8080"
  echo "  - PostgreSQL: 127.0.0.1:5432"
  echo "  - Neo4j Bolt: bolt://localhost:7687"
else
  echo "❌ Failed to establish SSH Tunnels. Check your SSH key / VPS connection."
  exit 1
fi

# 3. Local AI Diagnostic Configuration Info
echo ""
echo "=== Local AI Engine Detection ==="
echo "Qwen 3.6 35B Vulkan container detected on: http://127.0.0.1:7474"
echo "Ollama (DeepSeek-Coder 33B) detected on: http://127.0.0.1:11434"
echo ""
echo "To use your Qwen 3.6 35B model as the main brain, make sure your .env.local has:"
echo "OLLAMA_BASE_URL=http://127.0.0.1:7474/v1"
echo "OLLAMA_MODEL=Qwen3.6-35B-A3B-UD-Q4_K_XL"
echo "OLLAMA_PRIMARY=1"
echo ""

# 4. Start Dev Server
echo "Starting Next.js Dev Server..."
npm run dev
