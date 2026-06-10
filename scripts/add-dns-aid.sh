#!/bin/bash
# Add DNS-AID (DNS for AI Discovery) TXT records via Cloudflare API
# TXT fallback since SVCB/HTTPS format is tricky via API

CF_EMAIL="lyndon@widescopeindustries.com"
CF_KEY="${CF_KEY:-YOUR_CLOUDFLARE_API_KEY}"
ZONE_ID="39bc783c4300814591558911c805facc"

echo "Adding DNS-AID TXT records..."

# _index._agents — general agent index
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "_index._agents.alloemmanuals.com",
    "content": "endpoint=https://alloemmanuals.com/.well-known/api-catalog",
    "ttl": 3600,
    "proxied": false
  }'

echo ""

# _a2a._agents — A2A discovery
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "_a2a._agents.alloemmanuals.com",
    "content": "endpoint=https://alloemmanuals.com/.well-known/acp.json",
    "ttl": 3600,
    "proxied": false
  }'

echo ""

# _mcp._agents — MCP discovery
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_KEY" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "_mcp._agents.alloemmanuals.com",
    "content": "endpoint=https://alloemmanuals.com/.well-known/mcp/server-card.json",
    "ttl": 3600,
    "proxied": false
  }'

echo ""
echo "Done."
