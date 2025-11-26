#!/bin/bash
# Setup Swap Script for Manualmode Server
# This script creates a 4GB swap file to prevent OOM kills
# Run as root: sudo bash setup-swap.sh

set -e  # Exit on error

echo "==================================="
echo "  Swap Setup for Manualmode Server"
echo "==================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Error: This script must be run as root"
    echo "   Please run: sudo bash setup-swap.sh"
    exit 1
fi

# Check if swap already exists
if [ -f /swapfile ]; then
    echo "⚠️  Warning: /swapfile already exists!"
    echo ""
    swapon --show
    echo ""
    read -p "Do you want to recreate it? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    # Disable and remove existing swap
    echo "Removing existing swap..."
    swapoff /swapfile 2>/dev/null || true
    rm -f /swapfile
    sed -i '/\/swapfile/d' /etc/fstab
fi

echo "Creating 4GB swap file..."
echo "(This may take a few minutes)"
echo ""

# Create swap file (4GB = 4096 MB)
dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress

# Set proper permissions
chmod 600 /swapfile

# Make it a swap file
mkswap /swapfile

# Enable swap
swapon /swapfile

# Verify swap is active
echo ""
echo "✅ Swap created and activated!"
echo ""
swapon --show
echo ""

# Make it permanent
if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap added to /etc/fstab (persistent across reboots)"
fi

# Set swappiness to 10 (low swappiness = prefer RAM)
echo "Setting swappiness to 10 (prefer RAM over swap)..."
sysctl vm.swappiness=10

# Make swappiness permanent
if ! grep -q 'vm.swappiness' /etc/sysctl.conf; then
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "✅ Swappiness setting made permanent in /etc/sysctl.conf"
else
    sed -i 's/^vm.swappiness=.*/vm.swappiness=10/' /etc/sysctl.conf
    echo "✅ Updated swappiness in /etc/sysctl.conf"
fi

echo ""
echo "==================================="
echo "  ✅ Swap Setup Complete!"
echo "==================================="
echo ""
echo "Current memory status:"
free -h
echo ""
echo "Swap is now active and will persist across reboots."
echo "Swappiness is set to 10 (low) to prefer RAM usage."

