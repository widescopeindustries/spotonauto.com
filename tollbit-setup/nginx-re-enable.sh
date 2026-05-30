#!/bin/bash
# Re-enable Tollbit redirects after proper DNS setup is verified
# Run this ONLY after: DNS resolves, Cloudflare Worker is deployed, Tollbit is live

set -e

echo "=== Tollbit Redirect Re-Enable Script ==="
echo ""
echo "This script re-enables the nginx bot redirect to Tollbit."
echo "Run this ONLY after confirming tollbit.alloemmanuals.com resolves correctly."
echo ""

# Check DNS first
if ! dig tollbit.alloemmanuals.com +short | grep -q '.'; then
    echo "ERROR: tollbit.alloemmanuals.com does not resolve!"
    echo "Fix DNS before running this script."
    exit 1
fi

echo "✓ DNS resolves for tollbit.alloemmanuals.com"

# Check Tollbit subdomain responds
if ! curl -sI --max-time 5 "https://tollbit.alloemmanuals.com/" | grep -q "HTTP"; then
    echo "WARNING: tollbit.alloemmanuals.com responds but may not be fully configured"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ tollbit.alloemmanuals.com responds to HTTPS"
fi

# Re-enable the redirect in nginx config
echo "Re-enabling nginx redirect..."

sed -i 's|# DISABLED - tollbit subdomain has no DNS record|# ENABLED - Tollbit is live|' /etc/nginx/sites-enabled/alloemmanuals.com
sed -i 's|# return 302 https://tollbit.alloemmanuals.com\$request_uri;|return 302 https://tollbit.alloemmanuals.com$request_uri;|' /etc/nginx/sites-enabled/alloemmanuals.com

nginx -t && systemctl reload nginx

echo ""
echo "=== DONE ==="
echo "nginx Tollbit redirects are now LIVE."
echo ""
echo "Test with:"
echo "  curl -sI -A 'GPTBot/1.0' https://alloemmanuals.com/tools/toyota-camry-oil-type"
echo ""
echo "Expected: 302 → https://tollbit.alloemmanuals.com/tools/toyota-camry-oil-type"
