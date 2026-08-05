# 🐳 Podman Reference Guide

This project uses **Podman** as the container engine for the alternative server deployment.

> **Note:** This is a reference guide for Podman commands and concepts. For deployment instructions, see:
> - [Quick Start ManualMode Server](QUICK-START-MANUALMODE-SERVER.md)
> - [ManualMode Dual Environment](MANUALMODE-DUAL-ENVIRONMENT.md)

## 🎯 About Podman

Podman is the container engine used for alternative server deployments:

- **Podman** - Container engine (like Docker but better)
- **Podman Compose** - Multi-container orchestration (like Docker Compose)

## ✨ Benefits of Podman

### Why Use Podman?

1. **Rootless by Default** - Better security, no root privileges needed
2. **Daemonless** - No background daemon consuming resources
3. **Docker-Compatible** - Drop-in replacement for Docker
4. **Systemd Integration** - Native systemd support for services
5. **Pods Support** - Kubernetes-like pod concepts
6. **Faster Startup** - No daemon means faster container launches

### Key Differences from Docker

| Feature | Podman | Docker |
|---------|--------|--------|
| Daemon | ❌ Daemonless | ✅ Requires daemon |
| Root | ❌ Rootless by default | ⚠️ Requires root/sudo |
| Drop-in | ✅ `alias docker=podman` works | - |
| Systemd | ✅ Native integration | ⚠️ Limited |
| CLI | 99% compatible | - |

## 📦 Installation

### macOS

```bash
# Using Homebrew
brew install podman

# Initialize and start the Podman machine
podman machine init
podman machine start

# Install podman-compose
brew install podman-compose
# or
pip3 install podman-compose
```

### Linux (Fedora/RHEL/CentOS)

```bash
sudo dnf install podman podman-compose
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install podman
pip3 install podman-compose
```

### Verify Installation

```bash
# Check Podman
podman --version
podman info

# Check Podman Compose
podman-compose --version

# Test it works
podman run hello-world
```

## 🚀 Usage with Deployment System

### No Configuration Needed!

The deployment system automatically uses Podman if available:

```bash
# This will use Podman automatically
make build
make deploy-compose
./deploy.sh
```

### Check What's Being Used

```bash
# See which engine is detected
make help

# Output shows:
# Meaningful Conversations Deployment
# Using: podman + podman-compose
```

### Manual Override (if needed)

If you have both installed and want to force Docker:

```bash
# Temporarily use Docker
alias podman=docker
alias podman-compose=docker-compose

# Or uninstall Podman
brew uninstall podman
```

## 🔧 Podman-Specific Commands

### All Standard Commands Work

```bash
# Building
make build              # Uses podman build
make build-no-cache     # Uses podman build --no-cache

# Compose
make deploy-compose     # Uses podman-compose up -d
make logs               # Uses podman-compose logs
make status             # Uses podman-compose ps

# Deployment
./deploy.sh             # Auto-detects podman
```

### Podman Machine (macOS/Windows)

On macOS/Windows, Podman runs in a VM:

```bash
# Start the machine
podman machine start

# Stop the machine
podman machine stop

# Check machine status
podman machine list

# SSH into the machine (if needed)
podman machine ssh
```

### macOS Podman VM — before local deploy builds (CRITICAL)

**Context:** `./deploy-manualmode.sh` builds images **locally on your Mac**, then pushes to the registry. That uses the **Podman machine VM**, not the Linux server Podman.

**Symptoms:**
- `Cannot connect to Podman … dial tcp 127.0.0.1:63947: connect: connection refused`
- `Error: server probably quit: unexpected EOF` during `podman build` (often mid-`npm install`)
- `podman machine list` shows **running**, but `podman ps` fails in another terminal

**Cause:** The Apple HV VM may be stopped, still starting, or crashed while the CLI connection cache is stale. Starting the machine in one shell and deploying from another can fail if the socket is not ready yet.

**Automatic fix (preferred):** `deploy-manualmode.sh` runs `scripts/ensure-local-podman.sh` before any local build — start machine, wait for `podman info`, restart once if needed.

**Manual preflight:**
```bash
./scripts/ensure-local-podman.sh
# or same shell session:
podman machine start
for i in 1 2 3 4 5 6 7 8 9 10; do podman ps >/dev/null 2>&1 && break; sleep 3; done
podman ps
./deploy-manualmode.sh -e staging -c frontend
```

**If still failing:**
```bash
podman machine stop
sleep 2
podman machine start
./scripts/ensure-local-podman.sh
```

**Nuclear reset (last resort):** see [Podman Machine Won't Start](#podman-machine-wont-start-macos) below.

**Note:** Remote deploy steps (`ssh root@… podman-compose …`) use **Linux Podman on the server** — unrelated to the macOS VM issues above.

### Rootless Containers

Podman runs rootless by default:

```bash
# Check if running rootless
podman info | grep rootless

# Containers run as your user
podman ps
# USER column shows your username

# No sudo needed!
podman run -d nginx  # Works without sudo
```

## 🎨 Docker Compatibility

### Drop-in Replacement

Podman is designed to be a drop-in replacement:

```bash
# Create an alias (add to ~/.bashrc or ~/.zshrc)
alias docker=podman
alias docker-compose=podman-compose

# Now docker commands work!
docker build -t myimage .
docker run myimage
docker ps
```

### 99% Compatible

Almost all Docker commands work with Podman:

```bash
podman build      # ✅ Works
podman run        # ✅ Works
podman push       # ✅ Works
podman pull       # ✅ Works
podman ps         # ✅ Works
podman logs       # ✅ Works
podman exec       # ✅ Works
podman compose    # ✅ Works (built-in from v4.1+)
```

### Minor Differences

Few commands have slight differences:

```bash
# Docker Swarm
docker swarm init  # ❌ Not in Podman (use pods instead)

# Docker Desktop
docker context     # ⚠️ Different in Podman

# BuildKit
docker buildx      # ⚠️ Podman uses different build system
```

## 🔒 Security Benefits

### Rootless by Default

```bash
# Podman containers don't need root
whoami              # youruser
podman run alpine whoami  # youruser (not root!)

# Docker requires root or docker group
docker run alpine whoami  # root (security risk!)
```

### No Privileged Daemon

```bash
# Podman: No daemon = No privileged process
ps aux | grep podman  # Only your processes

# Docker: Daemon runs as root
ps aux | grep dockerd  # root daemon always running
```

### Better Isolation

```bash
# Each user has their own container namespace
podman ps  # Only sees your containers

# Systemd user services
systemctl --user start container-myapp
```

## 📊 Performance

### Resource Usage

```bash
# Podman (no daemon)
ps aux | grep podman  # Only active container processes

# Docker (always running daemon)
ps aux | grep dockerd  # Daemon + containers
```

### Startup Time

```bash
# Podman: Instant (no daemon to start)
time podman run hello-world  # ~0.5s

# Docker: Waits for daemon
time docker run hello-world  # ~1-2s
```

## 🛠️ Troubleshooting

### Podman Machine Won't Start (macOS)

```bash
# Reset the machine
podman machine stop
podman machine rm
podman machine init
podman machine start
```

### Podman connection refused during local deploy (macOS)

**Symptom:** `connection refused` on `127.0.0.1:63947` or build aborts with `unexpected EOF`.

**Fix:** Run `./scripts/ensure-local-podman.sh` or let `deploy-manualmode.sh` preflight handle it. Do **not** rely on `podman machine list` alone — wait until `podman info` succeeds.

See [macOS Podman VM — before local deploy builds](#macos-podman-vm--before-local-deploy-builds-critical) above.

### Port Already in Use

```bash
# Podman uses different ports than Docker
# Both can coexist!

# Check what's using ports
lsof -i :8080
netstat -an | grep 8080
```

### Permission Denied

```bash
# Make sure you're rootless
podman info | grep rootless  # Should say true

# Check subuid/subgid (Linux)
cat /etc/subuid
cat /etc/subgid

# Should have your username
```

### Compose Not Working

```bash
# Install podman-compose
pip3 install podman-compose

# Or use built-in compose (Podman 4.1+)
podman compose version

# Update Podman if old
brew upgrade podman  # macOS
sudo dnf update podman  # Linux
```

### Can't Pull Images

```bash
# Login to registry
podman login docker.io

# Check registries
cat ~/.config/containers/registries.conf

# Try short name
podman pull nginx
# vs full name
podman pull docker.io/library/nginx
```

## 🎓 Migrating from Docker

### Step 1: Install Podman

```bash
# macOS
brew install podman podman-compose
podman machine init
podman machine start

# Linux
sudo apt-get install podman
pip3 install podman-compose
```

### Step 2: Test Compatibility

```bash
# Run existing Docker commands with podman
podman run hello-world
podman ps
podman images
```

### Step 3: Create Aliases (Optional)

```bash
# Add to ~/.zshrc or ~/.bashrc
alias docker=podman
alias docker-compose=podman-compose

# Reload shell
source ~/.zshrc
```

### Step 4: Deploy!

```bash
# Our deployment system auto-detects!
make deploy
```

## 📚 Resources

### Official Documentation

- [Podman Official Site](https://podman.io/)
- [Podman Tutorials](https://docs.podman.io/en/latest/Tutorials.html)
- [Podman vs Docker](https://docs.podman.io/en/latest/Introduction.html)

### Quick References

- [Podman Command Cheat Sheet](https://cheatsheet.dennyzhang.com/cheatsheet-podman-a4)
- [Docker to Podman Migration](https://podman.io/getting-started/migration)

## 💡 Pro Tips

### Tip 1: Create Alias for Compatibility

```bash
# Add to shell config
alias docker=podman
alias docker-compose=podman-compose

# Now all Docker docs/scripts work!
```

### Tip 2: Use Pods for Related Containers

```bash
# Create a pod (like Kubernetes)
podman pod create --name mypod -p 8080:8080

# Add containers to the pod
podman run -d --pod mypod backend
podman run -d --pod mypod frontend

# They share networking automatically!
```

### Tip 3: Generate Systemd Services

```bash
# Auto-generate systemd unit files
podman generate systemd --name mycontainer > ~/.config/systemd/user/mycontainer.service

# Enable autostart
systemctl --user enable mycontainer
systemctl --user start mycontainer
```

### Tip 4: Use Podman Desktop

```bash
# Install Podman Desktop (GUI)
brew install podman-desktop

# Or download from:
# https://podman-desktop.io/
```

## ✅ Verification Checklist

Test your Podman setup:

```bash
# 1. Podman installed
podman --version

# 2. Machine running (macOS/Windows)
podman machine list

# 3. Can run containers
podman run hello-world

# 4. Compose installed
podman-compose --version

# 5. Can build images
podman build -t test .

# 6. Can push to registry
podman login docker.io
podman push test

# 7. Deployment system detects it
make help  # Should show "Using: podman"

# 8. Full deployment works
./test-deployment.sh
```

---

## 🎉 Summary

✅ **Podman is fully supported**  
✅ **Auto-detected automatically**  
✅ **No configuration changes needed**  
✅ **Better security than Docker**  
✅ **Docker-compatible commands**  
✅ **Rootless by default**  
✅ **No daemon overhead**  

**Just install Podman and everything works!** 🚀

---

*The deployment system works seamlessly with both Podman and Docker. Use whichever you prefer!*





