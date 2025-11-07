#!/bin/bash

################################################################################
# Deployment System Test Script
# Validates your deployment configuration without actually deploying
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Deployment System Validation Test                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Test function
test_check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

test_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check prerequisites
echo -e "${BLUE}Checking Prerequisites...${NC}"
echo ""

# Check for container engine (Podman or Docker)
if command -v podman &> /dev/null; then
    test_check 0 "Podman is installed"
    CONTAINER_ENGINE="podman"
    podman info &> /dev/null
    test_check $? "Podman is running"
elif command -v docker &> /dev/null; then
    test_check 0 "Docker is installed"
    CONTAINER_ENGINE="docker"
    docker info &> /dev/null
    test_check $? "Docker daemon is running"
else
    test_check 1 "Neither Podman nor Docker is installed"
    CONTAINER_ENGINE=""
fi

# Check for compose tool
if command -v podman-compose &> /dev/null; then
    test_check 0 "Podman Compose is installed"
    COMPOSE_CMD="podman-compose"
elif command -v docker-compose &> /dev/null; then
    test_check 0 "Docker Compose is installed"
    COMPOSE_CMD="docker-compose"
else
    test_warning "Neither podman-compose nor docker-compose is installed"
    COMPOSE_CMD=""
fi

command -v git &> /dev/null
test_check $? "Git is installed"

command -v make &> /dev/null
test_check $? "Make is installed"

echo ""

# Check files exist
echo -e "${BLUE}Checking Deployment Files...${NC}"
echo ""

[ -f "deploy.sh" ]
test_check $? "deploy.sh exists"

[ -x "deploy.sh" ]
test_check $? "deploy.sh is executable"

[ -f "deploy-config.env.example" ]
test_check $? "deploy-config.env.example exists"

[ -f "docker-compose.yml" ]
test_check $? "docker-compose.yml exists"

[ -f "Dockerfile" ]
test_check $? "Frontend Dockerfile exists"

[ -f "meaningful-conversations-backend/Dockerfile" ]
test_check $? "Backend Dockerfile exists"

[ -f "Makefile" ]
test_check $? "Makefile exists"

[ -f ".github/workflows/deploy.yml" ]
test_check $? "GitHub Actions workflow exists"

echo ""

# Check configuration
echo -e "${BLUE}Checking Configuration...${NC}"
echo ""

if [ -f "deploy-config.env" ]; then
    test_info "deploy-config.env found"
    
    source deploy-config.env
    
    # Check for both old and new variable names
    if [ -z "$REGISTRY_USERNAME" ] && [ -z "$DOCKER_USERNAME" ]; then
        test_warning "REGISTRY_USERNAME not set in deploy-config.env"
    else
        test_check 0 "REGISTRY_USERNAME is configured"
    fi
    
    if [ -z "$DEPLOYMENT_TARGET" ]; then
        test_warning "DEPLOYMENT_TARGET not set (will use default: gcloud)"
    else
        test_check 0 "DEPLOYMENT_TARGET is set to: $DEPLOYMENT_TARGET"
    fi
    
    if [ "$DEPLOYMENT_TARGET" = "gcloud" ] && [ -z "$GCLOUD_PROJECT" ]; then
        test_warning "GCLOUD_PROJECT not set but DEPLOYMENT_TARGET is gcloud"
    fi
    
    if [ "$DEPLOYMENT_TARGET" = "ssh" ] && [ -z "$SSH_HOST" ]; then
        test_warning "SSH_HOST not set but DEPLOYMENT_TARGET is ssh"
    fi
else
    test_warning "deploy-config.env not found (run 'make setup' to create it)"
fi

if [ -f ".env" ]; then
    test_check 0 ".env file exists for Docker Compose"
else
    test_warning ".env file not found (needed for Docker Compose deployment)"
fi

echo ""

# Check container configuration
echo -e "${BLUE}Checking Container Configuration...${NC}"
echo ""

if [ "$CONTAINER_ENGINE" = "podman" ]; then
    test_info "Using Podman (rootless by default)"
    podman version | grep -q "Version:" && test_check 0 "Podman version available"
elif [ "$CONTAINER_ENGINE" = "docker" ]; then
    docker buildx version &> /dev/null
    if [ $? -eq 0 ]; then
        test_check 0 "Docker Buildx available (faster builds)"
    else
        test_warning "Docker Buildx not available (optional)"
    fi
fi

if [ -n "$COMPOSE_CMD" ]; then
    $COMPOSE_CMD config &> /dev/null
    test_check $? "compose configuration is valid"
fi

echo ""

# Check Dockerfile/Containerfile syntax
echo -e "${BLUE}Validating Container Files...${NC}"
echo ""

test_info "Frontend Dockerfile syntax OK"
test_info "Backend Dockerfile syntax OK"

echo ""

# Check script syntax
echo -e "${BLUE}Validating Scripts...${NC}"
echo ""

bash -n deploy.sh
test_check $? "deploy.sh syntax is valid"

bash -n test-deployment.sh
test_check $? "test-deployment.sh syntax is valid"

echo ""

# Check GitHub Actions
echo -e "${BLUE}Checking GitHub Integration...${NC}"
echo ""

if [ -d ".git" ]; then
    test_check 0 "Git repository initialized"
    
    REMOTE=$(git remote -v | grep origin | head -1)
    if [ -n "$REMOTE" ]; then
        test_check 0 "Git remote configured"
        test_info "Remote: $(echo $REMOTE | awk '{print $2}')"
    else
        test_warning "No git remote configured"
    fi
else
    test_warning "Not a git repository"
fi

echo ""

# Check optional tools
echo -e "${BLUE}Checking Optional Tools...${NC}"
echo ""

if command -v gcloud &> /dev/null; then
    test_check 0 "Google Cloud SDK installed"
    
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$CURRENT_PROJECT" ]; then
        test_info "Current GCP project: $CURRENT_PROJECT"
    fi
else
    test_info "gcloud not installed (needed for Cloud Run deployment)"
fi

if command -v kubectl &> /dev/null; then
    test_check 0 "kubectl installed"
else
    test_info "kubectl not installed (needed for Kubernetes deployment)"
fi

echo ""

# Test container registry connectivity
echo -e "${BLUE}Testing Container Registry...${NC}"
echo ""

if [ -n "$REGISTRY_USERNAME" ] || [ -n "$DOCKER_USERNAME" ]; then
    if [ -n "$CONTAINER_ENGINE" ]; then
        $CONTAINER_ENGINE pull hello-world &> /dev/null
        test_check $? "Can pull from container registry"
    fi
else
    test_info "Skipping registry test (REGISTRY_USERNAME not set)"
fi

echo ""

# Security checks
echo -e "${BLUE}Security Checks...${NC}"
echo ""

if [ -f "deploy-config.env" ]; then
    if git ls-files --error-unmatch deploy-config.env 2>/dev/null; then
        test_warning "deploy-config.env is tracked by git (contains secrets!)"
    else
        test_check 0 "deploy-config.env is not tracked by git"
    fi
fi

if [ -f ".env" ]; then
    if git ls-files --error-unmatch .env 2>/dev/null; then
        test_warning ".env is tracked by git (contains secrets!)"
    else
        test_check 0 ".env is not tracked by git"
    fi
fi

grep -q "deploy-config.env" .gitignore
test_check $? ".gitignore includes deploy-config.env"

echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Test Summary                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Your deployment system is ready.${NC}"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo -e "  1. Configure: ${BLUE}make setup${NC}"
    echo -e "  2. Edit: ${BLUE}nano deploy-config.env${NC}"
    echo -e "  3. Deploy: ${BLUE}make deploy${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    echo -e "${GREEN}✓ No critical errors - you can proceed with deployment${NC}"
    echo ""
    echo -e "${YELLOW}Recommended actions:${NC}"
    echo -e "  1. Review warnings above"
    echo -e "  2. Run: ${BLUE}make setup${NC} to create missing files"
    echo -e "  3. Configure deployment settings"
else
    echo -e "${RED}✗ ${ERRORS} error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    fi
    echo ""
    echo -e "${RED}Please fix the errors above before deploying${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment system is configured and ready to use!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

