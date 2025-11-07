#!/bin/bash
################################################################################
# Automated Deployment Script for Meaningful Conversations
# Simplifies deployment to staging and production environments
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration (from migration_guide.md)
PROJECT_ID="gen-lang-client-0944710545"
REGION="europe-west6"
REGISTRY="europe-west6-docker.pkg.dev"

# Version from package.json
VERSION=$(grep -m1 '"version"' package.json | awk -F'"' '{print $4}')

# Parse arguments
ENVIRONMENT="staging"  # default to staging
COMPONENT="all"        # default to deploy both
SKIP_BUILD=false
SKIP_PUSH=false
DRY_RUN=false

show_help() {
    echo -e "${GREEN}Automated Deployment for Meaningful Conversations${NC}"
    echo ""
    echo "Usage: ./deploy-auto.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV         Environment: staging (default) or production"
    echo "  -c, --component COMP  Component: all (default), frontend, or backend"
    echo "  -s, --skip-build      Skip building images (use existing)"
    echo "  -p, --skip-push       Skip pushing images (deploy existing)"
    echo "  -d, --dry-run         Show what would be deployed without doing it"
    echo "  -v, --version VER     Use specific version tag (default: from package.json)"
    echo "  -h, --help            Show this help"
    echo ""
    echo "Examples:"
    echo "  ${BLUE}./deploy-auto.sh${NC}                              # Deploy all to staging"
    echo "  ${BLUE}./deploy-auto.sh -e production${NC}                # Deploy all to production"
    echo "  ${BLUE}./deploy-auto.sh -c frontend${NC}                  # Deploy only frontend to staging"
    echo "  ${BLUE}./deploy-auto.sh -e production -c frontend${NC}    # Deploy frontend to production"
    echo "  ${BLUE}./deploy-auto.sh --skip-build -c frontend${NC}     # Quick deploy frontend (no rebuild)"
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
if [[ "$COMPONENT" != "all" && "$COMPONENT" != "frontend" && "$COMPONENT" != "backend" ]]; then
    echo -e "${RED}Error: Component must be 'all', 'frontend', or 'backend'${NC}"
    exit 1
fi

# Confirmation for production
if [[ "$ENVIRONMENT" == "production" && "$DRY_RUN" == false ]]; then
    echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
    echo -e "${YELLOW}   Component: ${COMPONENT}${NC}"
    echo -e "${YELLOW}   Version: ${VERSION}${NC}"
    read -p "Are you sure? Type 'yes' to continue: " -r
    echo
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Meaningful Conversations Deployment${NC}              ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Environment:${NC}  $ENVIRONMENT"
echo -e "${BLUE}Component:${NC}    $COMPONENT"
echo -e "${BLUE}Version:${NC}      $VERSION"
echo -e "${BLUE}Dry Run:${NC}      $DRY_RUN"
echo ""

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    BACKEND_SERVICE="meaningful-conversations-backend-staging"
    FRONTEND_SERVICE="meaningful-conversations-frontend-staging"
    FRONTEND_URL="https://meaningful-conversations-frontend-staging-650095539575.europe-west6.run.app"
    DB_NAME="meaningful-convers-db-staging"
    INSTANCE_CONNECTION="gen-lang-client-0944710545:europe-west6:meaningful-convers-db-staging"
    DB_PASSWORD_SECRET="STAGING_DB_PASSWORD"
else
    BACKEND_SERVICE="meaningful-conversations-backend-prod"
    FRONTEND_SERVICE="meaningful-conversations-frontend-prod"
    FRONTEND_URL="https://meaningful-conversations-frontend-prod-650095539575.europe-west6.run.app"
    DB_NAME="meaningful-convers-db-prod"
    INSTANCE_CONNECTION="gen-lang-client-0944710545:europe-west6:meaningful-convers-db-prod"
    DB_PASSWORD_SECRET="PROD_DB_PASSWORD"
fi

BACKEND_IMAGE="$REGISTRY/$PROJECT_ID/backend-images/meaningful-conversations:$VERSION"
FRONTEND_IMAGE="$REGISTRY/$PROJECT_ID/frontend-images/meaningful-conversations-frontend:$VERSION"

# ============================================================================
# BUILD PHASE
# ============================================================================

if [[ "$SKIP_BUILD" == false ]]; then
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building Backend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $BACKEND_IMAGE"
        else
            cd meaningful-conversations-backend
            podman build --no-cache --platform linux/amd64 -t "$BACKEND_IMAGE" .
            cd ..
            echo -e "${GREEN}✓ Backend image built${NC}"
        fi
        echo ""
    fi

    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Building Frontend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would build: $FRONTEND_IMAGE"
        else
            npm run build
            podman build --no-cache --platform linux/amd64 -t "$FRONTEND_IMAGE" .
            echo -e "${GREEN}✓ Frontend image built${NC}"
        fi
        echo ""
    fi
else
    echo -e "${YELLOW}⏭️  Skipping build phase${NC}"
    echo ""
fi

# ============================================================================
# PUSH PHASE
# ============================================================================

if [[ "$SKIP_PUSH" == false && "$SKIP_BUILD" == false ]]; then
    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Pushing Backend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would push: $BACKEND_IMAGE"
        else
            podman push "$BACKEND_IMAGE"
            echo -e "${GREEN}✓ Backend image pushed${NC}"
        fi
        echo ""
    fi

    if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}Pushing Frontend Image${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        if [[ "$DRY_RUN" == true ]]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would push: $FRONTEND_IMAGE"
        else
            podman push "$FRONTEND_IMAGE"
            echo -e "${GREEN}✓ Frontend image pushed${NC}"
        fi
        echo ""
    fi
else
    echo -e "${YELLOW}⏭️  Skipping push phase${NC}"
    echo ""
fi

# ============================================================================
# DEPLOY PHASE
# ============================================================================

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "backend" ]]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Deploying Backend to $ENVIRONMENT${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    BACKEND_CMD="gcloud run deploy $BACKEND_SERVICE \\
    --image $BACKEND_IMAGE \\
    --platform managed \\
    --region $REGION \\
    --allow-unauthenticated \\
    --add-cloudsql-instances '$INSTANCE_CONNECTION' \\
    --set-secrets='API_KEY=API_KEY:latest,JWT_SECRET=JWT_SECRET:latest,MAILJET_API_KEY=MAILJET_API_KEY:latest,MAILJET_SECRET_KEY=MAILJET_SECRET_KEY:latest,DB_PASSWORD=$DB_PASSWORD_SECRET:latest,INITIAL_ADMIN_PASSWORD=INITIAL_ADMIN_PASSWORD:latest' \\
    --command='' --args='' \\
    --set-env-vars='DB_USER=admin@manualmode.at,DB_NAME=$DB_NAME,INSTANCE_UNIX_SOCKET=/cloudsql/$INSTANCE_CONNECTION,ENVIRONMENT_TYPE=$ENVIRONMENT,FRONTEND_URL=$FRONTEND_URL,MAILJET_SENDER_EMAIL=register@manualmode.at,INITIAL_ADMIN_EMAIL=admin@manualmode.at'"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would execute:"
        echo "$BACKEND_CMD"
    else
        eval "$BACKEND_CMD"
        echo -e "${GREEN}✓ Backend deployed to $ENVIRONMENT${NC}"
    fi
    echo ""
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "frontend" ]]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Deploying Frontend to $ENVIRONMENT${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    FRONTEND_CMD="gcloud run deploy $FRONTEND_SERVICE \\
    --image $FRONTEND_IMAGE \\
    --platform managed \\
    --region $REGION \\
    --allow-unauthenticated \\
    --port=8080"
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${YELLOW}[DRY RUN]${NC} Would execute:"
        echo "$FRONTEND_CMD"
    else
        eval "$FRONTEND_CMD"
        echo -e "${GREEN}✓ Frontend deployed to $ENVIRONMENT${NC}"
    fi
    echo ""
fi

# ============================================================================
# VERIFICATION
# ============================================================================

if [[ "$DRY_RUN" == false ]]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Deployment Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
    echo ""
else
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Dry run complete - no changes made${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

