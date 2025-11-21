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

# Version from package.json
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
    echo "  -c, --component COMP  Component: all (default), frontend, or backend"
    echo "  --server HOST         Remote server (default: root@91.99.193.87)"
    echo "  -s, --skip-build      Skip building images (use existing)"
    echo "  -p, --skip-push       Skip pushing to registry (deploy existing)"
    echo "  -d, --dry-run         Show what would be deployed without doing it"
    echo "  -v, --version VER     Use specific version tag (default: from package.json)"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  ${BLUE}./deploy-manualmode.sh${NC}                    # Deploy all to staging"
    echo "  ${BLUE}./deploy-manualmode.sh -e production${NC}      # Deploy all to production"
    echo "  ${BLUE}./deploy-manualmode.sh -c frontend${NC}        # Deploy frontend to staging"
    echo "  ${BLUE}./deploy-manualmode.sh --server root@1.2.3.4${NC}  # Deploy to different server"
    echo "  ${BLUE}./deploy-manualmode.sh -e production -c frontend${NC}  # Deploy frontend to production"
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

# Validate component
if [[ "$COMPONENT" != "all" && "$COMPONENT" != "frontend" && "$COMPONENT" != "backend" && "$COMPONENT" != "tts" ]]; then
    echo -e "${RED}Error: Component must be 'all', 'frontend', 'backend', or 'tts'${NC}"
    exit 1
fi

# Load environment-specific configuration
ENV_FILE=".env.$ENVIRONMENT"
if [ -f "$ENV_FILE" ]; then
    export $(grep -E '^REGISTRY_URL=|^REGISTRY_USER=|^VERSION=' "$ENV_FILE" | xargs)
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
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
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

    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building Frontend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        FRONTEND_IMAGE="$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $FRONTEND_IMAGE"
        else
            npm run build
            podman build --platform linux/amd64 -t "$FRONTEND_IMAGE" .
            podman tag "$FRONTEND_IMAGE" "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:latest"
            echo -e "${GREEN}✓ Frontend image built${NC}"
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
    
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
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
    
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
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
if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
    echo "Pulling backend image..."
    podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-backend:$VERSION" || echo "Warning: Could not pull backend image"
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
    echo "Pulling frontend image..."
    podman pull "$REGISTRY_URL/$REGISTRY_USER/meaningful-conversations-frontend:$VERSION" || echo "Warning: Could not pull frontend image"
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
    /usr/local/bin/update-nginx-ips.sh $ENVIRONMENT
else
    echo "Warning: nginx IP update script not found. Skipping nginx update."
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
    echo -e "${YELLOW}Testing connectivity...${NC}"
    sleep 5
    
    # Test frontend
    if curl -f -s -o /dev/null "$FRONTEND_TEST_URL"; then
        echo -e "${GREEN}✓ Frontend is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend not responding yet (may still be starting)${NC}"
    fi
    
    # Test backend
    if curl -f -s -o /dev/null "$BACKEND_TEST_URL/health"; then
        echo -e "${GREEN}✓ Backend is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Backend not responding yet (may still be starting)${NC}"
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

