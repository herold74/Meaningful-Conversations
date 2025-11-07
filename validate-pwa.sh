#!/bin/bash
# PWA Validation Script for iOS Home Screen Issues
# This script helps verify all required PWA files are present and configured correctly

echo "🔍 PWA Configuration Validation"
echo "================================"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ dist/ directory not found. Run 'npm run build' first."
    exit 1
fi

cd dist

echo "📱 Checking iOS/PWA Files:"
echo ""

# Check manifest.json
if [ -f "manifest.json" ]; then
    echo "✅ manifest.json exists"
    # Validate it's valid JSON
    if python3 -m json.tool manifest.json > /dev/null 2>&1; then
        echo "   ✓ Valid JSON format"
    else
        echo "   ⚠️  Invalid JSON format"
    fi
else
    echo "❌ manifest.json MISSING"
fi

# Check apple-touch-icon
if [ -f "apple-touch-icon.png" ]; then
    echo "✅ apple-touch-icon.png exists"
    SIZE=$(sips -g pixelWidth apple-touch-icon.png 2>/dev/null | grep pixelWidth | awk '{print $2}')
    if [ "$SIZE" = "180" ]; then
        echo "   ✓ Correct size: 180x180"
    else
        echo "   ⚠️  Size: ${SIZE}x${SIZE} (should be 180x180)"
    fi
else
    echo "❌ apple-touch-icon.png MISSING"
fi

# Check icon-main
if [ -f "icon-main.png" ]; then
    echo "✅ icon-main.png exists"
    SIZE=$(sips -g pixelWidth icon-main.png 2>/dev/null | grep pixelWidth | awk '{print $2}')
    if [ "$SIZE" = "512" ]; then
        echo "   ✓ Correct size: 512x512"
    else
        echo "   ⚠️  Size: ${SIZE}x${SIZE} (should be 512x512)"
    fi
else
    echo "❌ icon-main.png MISSING"
fi

# Check service worker
if [ -f "sw.js" ]; then
    echo "✅ sw.js exists"
else
    echo "⚠️  sw.js missing (optional but recommended)"
fi

echo ""
echo "📄 Checking index.html meta tags:"
echo ""

# Check for required meta tags
if grep -q 'apple-mobile-web-app-capable.*yes' index.html; then
    echo "✅ apple-mobile-web-app-capable found"
else
    echo "❌ apple-mobile-web-app-capable MISSING"
fi

if grep -q 'apple-touch-icon' index.html; then
    echo "✅ apple-touch-icon link found"
else
    echo "❌ apple-touch-icon link MISSING"
fi

if grep -q 'manifest.json' index.html; then
    echo "✅ manifest link found"
else
    echo "❌ manifest link MISSING"
fi

echo ""
echo "🌐 Server Requirements:"
echo ""
echo "⚠️  CRITICAL: Your app MUST be served over HTTPS"
echo "   iOS requires HTTPS for PWA installation"
echo ""
echo "⚠️  Ensure nginx.conf is deployed with correct MIME types"
echo "   manifest.json must be served as 'application/manifest+json'"
echo ""

echo "================================"
echo "✨ Validation Complete"
echo ""
echo "To test on iPhone:"
echo "1. Deploy these files to your HTTPS server"
echo "2. Open in Safari (not Chrome)"
echo "3. Tap Share button → 'Add to Home Screen'"
echo "4. Check that icon appears and stays on home screen"

