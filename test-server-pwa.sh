#!/bin/bash
# Test if your deployed server is serving PWA files correctly
# Usage: ./test-server-pwa.sh https://your-domain.com

if [ -z "$1" ]; then
    echo "❌ Please provide your server URL"
    echo "Usage: ./test-server-pwa.sh https://your-domain.com"
    exit 1
fi

URL="$1"
echo "🌐 Testing PWA Configuration on: $URL"
echo "=========================================="
echo ""

# Test manifest.json
echo "📄 Testing manifest.json..."
MANIFEST_RESPONSE=$(curl -sI "${URL}/manifest.json")
MANIFEST_STATUS=$(echo "$MANIFEST_RESPONSE" | grep "HTTP" | awk '{print $2}')
MANIFEST_TYPE=$(echo "$MANIFEST_RESPONSE" | grep -i "content-type" | awk '{print $2}' | tr -d '\r')

if [ "$MANIFEST_STATUS" = "200" ]; then
    echo "✅ manifest.json accessible (HTTP 200)"
    if [[ "$MANIFEST_TYPE" == *"application/manifest+json"* ]] || [[ "$MANIFEST_TYPE" == *"application/json"* ]]; then
        echo "✅ Content-Type: $MANIFEST_TYPE"
    else
        echo "❌ Wrong Content-Type: $MANIFEST_TYPE"
        echo "   Should be: application/manifest+json"
        echo "   ⚠️  CRITICAL: This will prevent iOS from recognizing the PWA!"
    fi
else
    echo "❌ manifest.json NOT accessible (HTTP $MANIFEST_STATUS)"
fi
echo ""

# Test apple-touch-icon
echo "🍎 Testing apple-touch-icon.png..."
ICON_STATUS=$(curl -sI "${URL}/apple-touch-icon.png" | grep "HTTP" | awk '{print $2}')
if [ "$ICON_STATUS" = "200" ]; then
    echo "✅ apple-touch-icon.png accessible (HTTP 200)"
else
    echo "❌ apple-touch-icon.png NOT accessible (HTTP $ICON_STATUS)"
fi
echo ""

# Test icon-main.png
echo "📱 Testing icon-main.png..."
MAIN_ICON_STATUS=$(curl -sI "${URL}/icon-main.png" | grep "HTTP" | awk '{print $2}')
if [ "$MAIN_ICON_STATUS" = "200" ]; then
    echo "✅ icon-main.png accessible (HTTP 200)"
else
    echo "❌ icon-main.png NOT accessible (HTTP $MAIN_ICON_STATUS)"
fi
echo ""

# Test if HTTPS
if [[ "$URL" == https://* ]]; then
    echo "✅ Using HTTPS (required for iOS PWA)"
else
    echo "❌ NOT using HTTPS - iOS requires HTTPS for PWA!"
    echo "   This is likely the main issue!"
fi
echo ""

# Check index.html for meta tags
echo "📋 Checking index.html for required meta tags..."
INDEX_HTML=$(curl -s "${URL}")

if echo "$INDEX_HTML" | grep -q "apple-mobile-web-app-capable"; then
    echo "✅ apple-mobile-web-app-capable found"
else
    echo "❌ apple-mobile-web-app-capable MISSING"
fi

if echo "$INDEX_HTML" | grep -q "apple-touch-icon"; then
    echo "✅ apple-touch-icon link found"
else
    echo "❌ apple-touch-icon link MISSING"
fi

if echo "$INDEX_HTML" | grep -q "manifest.json"; then
    echo "✅ manifest link found"
else
    echo "❌ manifest link MISSING"
fi
echo ""

# Download and validate manifest content
echo "🔍 Validating manifest.json content..."
MANIFEST_CONTENT=$(curl -s "${URL}/manifest.json")
if echo "$MANIFEST_CONTENT" | python3 -m json.tool > /dev/null 2>&1; then
    echo "✅ manifest.json is valid JSON"
    
    # Check for required fields
    if echo "$MANIFEST_CONTENT" | grep -q '"name"'; then
        NAME=$(echo "$MANIFEST_CONTENT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('name', 'N/A'))" 2>/dev/null)
        echo "   ✓ name: $NAME"
    fi
    
    if echo "$MANIFEST_CONTENT" | grep -q '"start_url"'; then
        echo "   ✓ start_url defined"
    else
        echo "   ⚠️  start_url missing"
    fi
    
    if echo "$MANIFEST_CONTENT" | grep -q '"display".*standalone'; then
        echo "   ✓ display: standalone"
    else
        echo "   ⚠️  display should be 'standalone'"
    fi
    
    # Check icons
    ICON_COUNT=$(echo "$MANIFEST_CONTENT" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('icons', [])))" 2>/dev/null)
    if [ "$ICON_COUNT" -gt 0 ]; then
        echo "   ✓ $ICON_COUNT icon(s) defined"
    else
        echo "   ❌ No icons defined in manifest"
    fi
else
    echo "❌ manifest.json is NOT valid JSON"
fi
echo ""

echo "=========================================="
echo "✨ Server Test Complete"
echo ""
echo "If you see any ❌ errors above, those need to be fixed!"
echo ""
echo "Common Issues:"
echo "1. Wrong MIME type for manifest.json → Check nginx.conf is deployed"
echo "2. Files return 404 → Rebuild and redeploy dist/ folder"  
echo "3. Not using HTTPS → iOS requires secure connection"
echo "4. Cache issues → Clear iOS Safari cache completely"

