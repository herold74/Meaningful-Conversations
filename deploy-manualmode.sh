#!/bin/bash
################################################################################
# Deployment Script for Manualmode Server (Podman-based)
# Deploys to ssh root@91.99.193.87
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="root@91.99.193.87"  # Default, can be overridden with --server
REMOTE_DIR="/opt/manualmode"

# Will be set after parsing arguments
ENV_FILE=""

# Use registry from env or default
REGISTRY_URL="${REGISTRY_URL:-localhost}"
REGISTRY_USER="${REGISTRY_USER:-gherold}"

# Version from package.json (SINGLE SOURCE OF TRUTH)
# IMPORTANT: Do NOT add VERSION to .env files - it will be ignored!
# The version is always read from package.json and explicitly set on the server.
VERSION=$(grep -m1 '"version"' package.json | awk -F'"' '{print $4}')

# Parse arguments
ENVIRONMENT="staging"  # default to staging
COMPONENT="all"        # default to deploy both
SKIP_BUILD=false
SKIP_PUSH=false
DRY_RUN=false
USE_REGISTRY=true      # Default to using registry

show_help() {
    echo -e "${GREEN}Manualmode Server Deployment for Meaningful Conversations${NC}"
    echo ""
    echo "Usage: ./deploy-manualmode.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV         Environment: staging (default) or production"
    echo "  -c, --component COMP  Component: all (default), app, frontend, backend, or tts"
    echo "  --server HOST         Remote server (default: root@91.99.193.87)"
    echo "  -s, --skip-build      Skip building images (use existing)"
    echo "  -p, --skip-push       Skip pushing to registry (deploy existing)"
    echo "  -d, --dry-run         Show what would be deployed without doing it"
    echo "  -v, --version VER     Use specific version tag (default: from package.json)"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  ${BLUE}./deploy-manualmode.sh${NC}                    # Build & deploy all to staging"
    echo "  ${BLUE}./deploy-manualmode.sh -e production${NC}      # Deploy staging images to production (no rebuild)"
    echo "  ${BLUE}./deploy-manualmode.sh -c app${NC}             # Build & deploy frontend+backend (no TTS)"
  echo "  ${BLUE}./deploy-manualmode.sh -c frontend${NC}        # Build & deploy frontend to staging"
    echo "  ${BLUE}./deploy-manualmode.sh --server root@1.2.3.4${NC}  # Deploy to different server"
    echo ""
    echo "Production deploys skip building and pushing — they pull the pre-built"
    echo "staging images from the registry. Principle: \"Build once, deploy everywhere\"."
    echo ""
    echo "Automatic Rollback:"
    echo "  If health checks fail after deployment, the script automatically"
    echo "  rolls back to the previous version. The previous version is saved"
    echo "  on the server before each deployment."
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--component)
            COMPONENT="$2"
            shift 2
            ;;
        --server)
            REMOTE_HOST="$2"
            shift 2
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -p|--skip-push)
            SKIP_PUSH=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'staging' or 'production'${NC}"
    exit 1
fi

# Production: never rebuild — always use pre-built staging images from registry
if [[ "$ENVIRONMENT" == "production" ]]; then
    SKIP_BUILD=true
    SKIP_PUSH=true
    echo -e "${YELLOW}Production: skipping build & push (using pre-built staging images from registry)${NC}"
fi

# Validate component
if [[ "$COMPONENT" != "all" && "$COMPONENT" != "app" && "$COMPONENT" != "frontend" && "$COMPONENT" != "backend" && "$COMPONENT" != "tts" ]]; then
    echo -e "${RED}Error: Component must be 'all', 'app', 'frontend', 'backend', or 'tts'${NC}"
    exit 1
fi

# Load environment-specific configuration
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    # Note: VERSION is intentionally NOT imported from env file - it comes from package.json
    export $(grep -E '^REGISTRY_URL=|^REGISTRY_USER=' "$ENV_FILE" | xargs)
    echo -e "${GREEN}✓ Loaded configuration from $ENV_FILE${NC}"
else
    echo -e "${YELLOW}⚠ Warning: $ENV_FILE not found${NC}"
    echo -e "${YELLOW}   Create it using: ./setup-manualmode-env.sh${NC}"
    echo -e "${YELLOW}   Or copy from template: cp env.${ENVIRONMENT}.template $ENV_FILE${NC}"
    exit 1
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    COMPOSE_FILE="podman-compose-staging.yml"
    REMOTE_ENV_DIR="$REMOTE_DIR-staging"
else
    COMPOSE_FILE="podman-compose-production.yml"
    REMOTE_ENV_DIR="$REMOTE_DIR-production"
fi

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Meaningful Conversations - Manualmode Server         ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Target:${NC}       $REMOTE_HOST"
echo -e "${BLUE}Environment:${NC}  $ENVIRONMENT"
echo -e "${BLUE}Registry:${NC}     $REGISTRY_URL/$REGISTRY_USER"
echo -e "${BLUE}Component:${NC}    $COMPONENT"
echo -e "${BLUE}Version:${NC}      $VERSION"
echo -e "${BLUE}Dry Run:${NC}      $DRY_RUN"
echo ""

# Check SSH connection
echo -e "${BLUE}Testing SSH connection...${NC}"
if [[ "$DRY_RUN" == false ]]; then
    if ! ssh -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
        echo -e "${RED}Error: Cannot connect to $REMOTE_HOST${NC}"
        echo -e "${YELLOW}Make sure you can SSH to the server without password (use ssh-copy-id)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${YELLOW}[DRY RUN] Would test SSH connection${NC}"
fi
echo ""

# ============================================================================
# BUILD PHASE
# ============================================================================

if [[ "$SKIP_BUILD" == false ]]; then
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "backend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building Backend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        BACKEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $BACKEND_IMAGE"
        else
            cd meaningful-conversations-backend
            podman build --platform linux/amd64 -t "$BACKEND_IMAGE" .
            podman tag "$BACKEND_IMAGE" "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:latest"
            cd ..
            echo -e "${GREEN}✓ Backend image built${NC}"
        fi
        echo ""
    fi

    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "tts" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building TTS Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        TTS_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-tts:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $TTS_IMAGE"
        else
            cd meaningful-conversations-backend
            # Build-Context: current dir (parent von tts-service/)
            podman build --platform linux/amd64 -f tts-service/Dockerfile -t "$TTS_IMAGE" .
            podman tag "$TTS_IMAGE" "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-tts:latest"
            cd ..
            echo -e "${GREEN}✓ TTS image built${NC}"
        fi
        echo ""
    fi

    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "frontend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building Frontend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        FRONTEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION"
        
        # Read current build number (will be incremented only after successful build)
        BUILD_NUM=$(cat BUILD_NUMBER 2>/dev/null || echo "0")
        NEXT_BUILD_NUM=$((BUILD_NUM + 1))
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $FRONTEND_IMAGE (Build $NEXT_BUILD_NUM)"
        else
            if podman build --platform linux/amd64 \
                --build-arg BUILD_NUMBER="$NEXT_BUILD_NUM" \
                --build-arg APP_VERSION="$VERSION" \
                -t "$FRONTEND_IMAGE" .; then
                # Only increment build number after successful build
                echo "$NEXT_BUILD_NUM" > BUILD_NUMBER
                podman tag "$FRONTEND_IMAGE" "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:latest"
                echo -e "${GREEN}✓ Frontend image built (v$VERSION, Build $NEXT_BUILD_NUM)${NC}"
            else
                echo -e "${RED}✗ Frontend build failed${NC}"
                exit 1
            fi
        fi
        echo ""
    fi

else
    echo -e "${YELLOW}⏭️  Skipping build phase${NC}"
    echo ""
fi

# ============================================================================
# PUSH TO REGISTRY
# ============================================================================

if [[ "$SKIP_PUSH" == false && "$SKIP_BUILD" == false ]]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Pushing Images to Registry${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Login to registry if not in dry run
    if [[ "$DRY_RUN" == false ]]; then
        echo -e "${YELLOW}Logging in to registry $REGISTRY_URL...${NC}"
        if [ -f "$ENV_FILE" ]; then
            export $(grep REGISTRY_PASSWORD "$ENV_FILE" | xargs)
            if [ -n "$REGISTRY_PASSWORD" ]; then
                echo "$REGISTRY_PASSWORD" | podman login "$REGISTRY_URL" -u "$REGISTRY_USER" --password-stdin
                echo -e "${GREEN}✓ Logged in to registry${NC}"
            else
                echo -e "${YELLOW}⚠ No REGISTRY_PASSWORD found, attempting login without it...${NC}"
                podman login "$REGISTRY_URL" -u "$REGISTRY_USER"
            fi
        else
            podman login "$REGISTRY_URL" -u "$REGISTRY_USER"
        fi
        echo ""
    fi
    
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "backend" ]]; then
        BACKEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would push: $BACKEND_IMAGE"
        else
            echo -e "${YELLOW}Pushing backend image...${NC}"
            podman push "$BACKEND_IMAGE"
            podman push "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:latest"
            echo -e "${GREEN}✓ Backend image pushed${NC}"
        fi
        echo ""
    fi
    
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "tts" ]]; then
        TTS_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-tts:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would push: $TTS_IMAGE"
        else
            echo -e "${YELLOW}Pushing TTS image...${NC}"
            podman push "$TTS_IMAGE"
            podman push "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-tts:latest"
            echo -e "${GREEN}✓ TTS image pushed${NC}"
        fi
        echo ""
    fi
    
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "frontend" ]]; then
        FRONTEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would push: $FRONTEND_IMAGE"
        else
            echo -e "${YELLOW}Pushing frontend image...${NC}"
            podman push "$FRONTEND_IMAGE"
            podman push "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:latest"
            echo -e "${GREEN}✓ Frontend image pushed${NC}"
        fi
        echo ""
    fi
else
    echo -e "${YELLOW}⏭️  Skipping push phase${NC}"
    echo ""
fi

# ============================================================================
# REMOTE DEPLOYMENT
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Deploying to Remote Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ "$DRY_RUN" == false ]]; then
    # Ensure remote directories exist
    echo -e "${YELLOW}Creating remote directories...${NC}"
    ssh "$REMOTE_HOST" "mkdir -p $REMOTE_ENV_DIR"
    echo -e "${GREEN}✓ Remote directories ready${NC}"
    echo ""
    
    # Create deployment script for remote execution
    cat > /tmp/remote-deploy.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

REMOTE_DIR="/opt/manualmode"
ENVIRONMENT="ENVIRONMENT_PLACEHOLDER"
VERSION="VERSION_PLACEHOLDER"
COMPONENT="COMPONENT_PLACEHOLDER"
REGISTRY_URL="REGISTRY_URL_PLACEHOLDER"
REGISTRY_USER="REGISTRY_USER_PLACEHOLDER"
COMPOSE_FILE="COMPOSE_FILE_PLACEHOLDER"

# Set environment-specific directory
if [[ "$ENVIRONMENT" == "staging" ]]; then
    ENV_DIR="$REMOTE_DIR-staging"
else
    ENV_DIR="$REMOTE_DIR-production"
fi

echo "Setting up deployment directory..."
mkdir -p "$ENV_DIR"
cd "$ENV_DIR"

# Login to registry if credentials are available
if [ -f .env ] && grep -q REGISTRY_PASSWORD .env; then
    echo "Logging in to registry..."
    export $(grep REGISTRY_PASSWORD .env | xargs)
    if [ -n "$REGISTRY_PASSWORD" ]; then
        echo "$REGISTRY_PASSWORD" | podman login "$REGISTRY_URL" -u "$REGISTRY_USER" --password-stdin 2>/dev/null || true
    fi
fi

# Pull latest images from registry
echo "Pulling images from registry..."
if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "backend" ]]; then
    echo "Pulling backend image..."
    podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:$VERSION" || echo "Warning: Could not pull backend image"
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "app" || "$COMPONENT" == "frontend" ]]; then
    echo "Pulling frontend image..."
    podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION" || echo "Warning: Could not pull frontend image"
fi

# Save current version for rollback (before stopping anything)
PREV_VERSION=""
if [ -f .env ]; then
    PREV_VERSION=$(grep -m1 '^VERSION=' .env 2>/dev/null | cut -d'=' -f2 || echo "")
fi
if [ -n "$PREV_VERSION" ] && [ "$PREV_VERSION" != "$VERSION" ]; then
    echo "$PREV_VERSION" > .previous-version
    echo "Saved previous version $PREV_VERSION for rollback"
else
    echo "No previous version to save (first deploy or same version)"
fi

# Stop existing containers
echo "Stopping existing containers..."
podman-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Start services
echo "Starting services with $COMPOSE_FILE..."
podman-compose -f "$COMPOSE_FILE" up -d

echo "Waiting for services to be healthy..."
sleep 10

# Check service status
echo "Service status:"
podman-compose -f "$COMPOSE_FILE" ps

# Update nginx reverse proxy IPs
echo "Updating nginx reverse proxy configuration..."
if [ -f "/usr/local/bin/update-nginx-ips.sh" ]; then
    /usr/local/bin/update-nginx-ips.sh $ENVIRONMENT || {
        echo "ERROR: Nginx IP update failed!"
        exit 1
    }
else
    echo "ERROR: nginx IP update script not found at /usr/local/bin/update-nginx-ips.sh"
    echo "This is critical - nginx will not route to the new containers!"
    exit 1
fi

echo "Deployment complete for $ENVIRONMENT!"
REMOTE_SCRIPT

    # Replace placeholders
    sed -i.bak "s/ENVIRONMENT_PLACEHOLDER/$ENVIRONMENT/g" /tmp/remote-deploy.sh
    sed -i.bak "s/VERSION_PLACEHOLDER/$VERSION/g" /tmp/remote-deploy.sh
    sed -i.bak "s/COMPONENT_PLACEHOLDER/$COMPONENT/g" /tmp/remote-deploy.sh
    sed -i.bak "s|REGISTRY_URL_PLACEHOLDER|$REGISTRY_URL|g" /tmp/remote-deploy.sh
    sed -i.bak "s/REGISTRY_USER_PLACEHOLDER/$REGISTRY_USER/g" /tmp/remote-deploy.sh
    sed -i.bak "s/COMPOSE_FILE_PLACEHOLDER/$COMPOSE_FILE/g" /tmp/remote-deploy.sh
    rm /tmp/remote-deploy.sh.bak

    # Transfer deployment files
    echo -e "${YELLOW}Transferring deployment configuration...${NC}"
    scp "$COMPOSE_FILE" "$REMOTE_HOST:$REMOTE_ENV_DIR/"
    
    # Check if environment-specific .env exists
    if [ -f "$ENV_FILE" ]; then
        scp "$ENV_FILE" "$REMOTE_HOST:$REMOTE_ENV_DIR/.env"
        # IMPORTANT: Ensure VERSION is always set correctly from package.json
        # This prevents any stale VERSION values in .env files from causing issues
        ssh "$REMOTE_HOST" "cd $REMOTE_ENV_DIR && sed -i '/^VERSION=/d' .env && echo 'VERSION=$VERSION' >> .env"
        echo -e "${GREEN}✓ VERSION set to $VERSION on server${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: $ENV_FILE not found. Using template.${NC}"
        echo -e "${YELLOW}   Create $ENV_FILE from env.$ENVIRONMENT.template before deploying!${NC}"
    fi
    
    # Transfer and execute deployment script
    scp /tmp/remote-deploy.sh "$REMOTE_HOST:/tmp/"
    ssh "$REMOTE_HOST" "chmod +x /tmp/remote-deploy.sh && /tmp/remote-deploy.sh"
    
    # Cleanup
    rm /tmp/remote-deploy.sh
    
    echo -e "${GREEN}✓ Remote deployment complete${NC}"
else
    echo -e "${YELLOW}[DRY RUN] Would deploy to remote server${NC}"
fi

echo ""

# ============================================================================
# VERIFICATION
# ============================================================================

if [[ "$DRY_RUN" == false ]]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Deployment Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Set URLs based on environment
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        FRONTEND_TEST_URL="https://mc-beta.manualmode.at"
        BACKEND_TEST_URL="https://mc-beta.manualmode.at/api"
    else
        FRONTEND_TEST_URL="https://mc-app.manualmode.at"
        BACKEND_TEST_URL="https://mc-app.manualmode.at/api"
    fi
    
    echo -e "${BLUE}Environment:${NC}  $ENVIRONMENT"
    echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_TEST_URL"
    echo -e "${BLUE}Backend API:${NC}  $BACKEND_TEST_URL"
    echo ""
    echo -e "${YELLOW}Testing connectivity (3 retries, 10s interval)...${NC}"
    
    DEPLOY_FAILED=false
    
    # Test frontend with retries
    FRONTEND_OK=false
    for i in 1 2 3; do
        sleep 10
        if curl -f -s -o /dev/null --max-time 10 "$FRONTEND_TEST_URL"; then
            echo -e "${GREEN}✓ Frontend is responding${NC}"
            FRONTEND_OK=true
            break
        else
            echo -e "${YELLOW}  Attempt $i/3: Frontend not responding yet...${NC}"
        fi
    done
    if [[ "$FRONTEND_OK" == false ]]; then
        echo -e "${RED}✗ FRONTEND NOT RESPONDING after 3 attempts${NC}"
        DEPLOY_FAILED=true
    fi
    
    # Test backend with retries
    BACKEND_OK=false
    for i in 1 2 3; do
        if curl -f -s -o /dev/null --max-time 10 "$BACKEND_TEST_URL/health"; then
            echo -e "${GREEN}✓ Backend is responding${NC}"
            BACKEND_OK=true
            break
        else
            echo -e "${YELLOW}  Attempt $i/3: Backend not responding yet...${NC}"
            sleep 10
        fi
    done
    if [[ "$BACKEND_OK" == false ]]; then
        echo -e "${RED}✗ BACKEND NOT RESPONDING after 3 attempts${NC}"
        DEPLOY_FAILED=true
    fi
    
    # Automatic rollback if services are not healthy
    if [[ "$DEPLOY_FAILED" == true ]]; then
        echo ""
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}DEPLOYMENT VERIFICATION FAILED -- INITIATING ROLLBACK${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        # Fetch backend logs for diagnostics before rollback
        echo -e "${YELLOW}Fetching backend logs for diagnostics...${NC}"
        ssh "$REMOTE_HOST" "cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE logs --tail 30 backend" 2>/dev/null || true
        echo ""
        
        # Check if a previous version exists on the server
        PREV_VERSION=$(ssh "$REMOTE_HOST" "cat $REMOTE_ENV_DIR/.previous-version 2>/dev/null" || echo "")
        
        if [[ -n "$PREV_VERSION" ]]; then
            echo -e "${YELLOW}Rolling back to previous version: $PREV_VERSION${NC}"
            
            # Create rollback script
            cat > /tmp/remote-rollback.sh << ROLLBACK_SCRIPT
#!/bin/bash
set -e
cd "$REMOTE_ENV_DIR"
COMPOSE_FILE="$COMPOSE_FILE"
PREV_VERSION="$PREV_VERSION"
REGISTRY_URL="$REGISTRY_URL"
REGISTRY_USER="$REGISTRY_USER"

echo "=== ROLLBACK: Stopping failed deployment ==="
podman-compose -f "\$COMPOSE_FILE" down 2>/dev/null || true

echo "=== ROLLBACK: Pulling previous images (v\$PREV_VERSION) ==="
podman pull "\$REGISTRY_URL/\$REGISTRY_USER/meaningful-conversations-backend:\$PREV_VERSION" || true
podman pull "\$REGISTRY_URL/\$REGISTRY_USER/meaningful-conversations-frontend:\$PREV_VERSION" || true
podman pull "\$REGISTRY_URL/\$REGISTRY_USER/meaningful-conversations-tts:\$PREV_VERSION" || true

echo "=== ROLLBACK: Restoring VERSION in .env ==="
sed -i '/^VERSION=/d' .env
echo "VERSION=\$PREV_VERSION" >> .env

echo "=== ROLLBACK: Starting services with v\$PREV_VERSION ==="
podman-compose -f "\$COMPOSE_FILE" up -d

echo "Waiting for rollback services to start..."
sleep 15

echo "=== ROLLBACK: Updating nginx ==="
if [ -f "/usr/local/bin/update-nginx-ips.sh" ]; then
    /usr/local/bin/update-nginx-ips.sh $ENVIRONMENT || echo "WARNING: Nginx update failed during rollback"
fi

echo "=== ROLLBACK: Service status ==="
podman-compose -f "\$COMPOSE_FILE" ps

echo "=== ROLLBACK COMPLETE ==="
ROLLBACK_SCRIPT
            
            scp /tmp/remote-rollback.sh "$REMOTE_HOST:/tmp/"
            ssh "$REMOTE_HOST" "chmod +x /tmp/remote-rollback.sh && /tmp/remote-rollback.sh"
            rm /tmp/remote-rollback.sh
            
            # Verify rollback health
            echo ""
            echo -e "${YELLOW}Verifying rollback health...${NC}"
            sleep 5
            
            ROLLBACK_OK=true
            if curl -f -s -o /dev/null --max-time 10 "$FRONTEND_TEST_URL"; then
                echo -e "${GREEN}✓ Frontend responding after rollback${NC}"
            else
                echo -e "${RED}✗ Frontend still not responding after rollback${NC}"
                ROLLBACK_OK=false
            fi
            if curl -f -s -o /dev/null --max-time 10 "$BACKEND_TEST_URL/health"; then
                echo -e "${GREEN}✓ Backend responding after rollback${NC}"
            else
                echo -e "${RED}✗ Backend still not responding after rollback${NC}"
                ROLLBACK_OK=false
            fi
            
            echo ""
            if [[ "$ROLLBACK_OK" == true ]]; then
                echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${GREEN}ROLLBACK SUCCESSFUL -- Restored to v$PREV_VERSION${NC}"
                echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
            else
                echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${RED}ROLLBACK FAILED -- Manual intervention required!${NC}"
                echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
                echo -e "${YELLOW}Check logs: ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE logs --tail 50'${NC}"
            fi
        else
            echo -e "${RED}No previous version found -- cannot rollback automatically${NC}"
            echo -e "${YELLOW}This appears to be the first deployment to this environment.${NC}"
            echo -e "${YELLOW}Check logs: ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE logs --tail 50 backend'${NC}"
        fi
        
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🧹 Cleanup: Removing unused images...${NC}"
    if ssh "$REMOTE_HOST" "podman image prune -f" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    else
        echo -e "${YELLOW}⚠ Cleanup skipped (no unused images or command failed)${NC}"
    fi
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo -e "  View logs:    ${BLUE}ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE logs -f'${NC}"
    echo -e "  Check status: ${BLUE}ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE ps'${NC}"
    echo -e "  Restart:      ${BLUE}ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE restart'${NC}"
    echo -e "  Stop:         ${BLUE}ssh $REMOTE_HOST 'cd $REMOTE_ENV_DIR && podman-compose -f $COMPOSE_FILE down'${NC}"
else
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Dry run complete - no changes made${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

