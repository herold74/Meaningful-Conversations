#!/bin/bash
# Cleanup script for local Docker/Podman images
# Keeps only the latest tagged images and removes dangling/old images

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Cleaning up local images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Remove dangling images (untagged intermediate layers)
echo "Removing dangling images..."
podman image prune -f
echo "✓ Dangling images removed"

# Step 2: List all meaningful-conversations images
echo ""
echo "Current meaningful-conversations images:"
podman images | grep "meaningful-conversations" || echo "No images found"

# Step 3: Remove old images (keep only 'latest' tag)
echo ""
echo "Removing old tagged images (keeping 'latest')..."

# Get all image IDs except 'latest'
OLD_BACKEND=$(podman images quay.myandi.de/gherold/meaningful-conversations-backend --format "{{.ID}} {{.Tag}}" | grep -v "latest" | awk '{print $1}' || true)
OLD_FRONTEND=$(podman images quay.myandi.de/gherold/meaningful-conversations-frontend --format "{{.ID}} {{.Tag}}" | grep -v "latest" | awk '{print $1}' || true)
OLD_TTS=$(podman images quay.myandi.de/gherold/meaningful-conversations-tts --format "{{.ID}} {{.Tag}}" | grep -v "latest" | awk '{print $1}' || true)

if [ -n "$OLD_BACKEND" ]; then
    echo "Removing old backend images: $OLD_BACKEND"
    echo "$OLD_BACKEND" | xargs -r podman rmi -f
    echo "✓ Old backend images removed"
else
    echo "No old backend images to remove"
fi

if [ -n "$OLD_FRONTEND" ]; then
    echo "Removing old frontend images: $OLD_FRONTEND"
    echo "$OLD_FRONTEND" | xargs -r podman rmi -f
    echo "✓ Old frontend images removed"
else
    echo "No old frontend images to remove"
fi

if [ -n "$OLD_TTS" ]; then
    echo "Removing old TTS images: $OLD_TTS"
    echo "$OLD_TTS" | xargs -r podman rmi -f
    echo "✓ Old TTS images removed"
else
    echo "No old TTS images to remove"
fi

# Step 4: Remove all untagged <none> images
echo ""
echo "Removing untagged images..."
UNTAGGED=$(podman images --filter "dangling=true" -q)
if [ -n "$UNTAGGED" ]; then
    echo "$UNTAGGED" | xargs -r podman rmi -f
    echo "✓ Untagged images removed"
else
    echo "No untagged images to remove"
fi

# Step 5: Show final state
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Cleanup complete! Remaining images:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
podman images | grep -E "(meaningful-conversations|REPOSITORY)" || echo "No meaningful-conversations images found"

# Show disk space saved
echo ""
echo "Disk space usage:"
podman system df

