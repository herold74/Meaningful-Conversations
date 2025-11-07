#!/bin/bash
################################################################################
# Setup Script for Alternative Server Environment Configuration
# Interactive script to create .env.staging and .env.production files
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Alternative Server Environment Setup                  ║${NC}"
echo -e "${GREEN}║  (Staging + Production)                                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Ask which environment to configure
echo -e "${BLUE}Which environment do you want to configure?${NC}"
echo -e "  1) ${GREEN}Staging${NC}  (port 8080)"
echo -e "  2) ${YELLOW}Production${NC}  (port 80)"
echo -e "  3) ${BLUE}Both${NC}  (recommended for initial setup)"
echo ""
read -p "Choice [3]: " ENV_CHOICE
ENV_CHOICE=${ENV_CHOICE:-3}

SETUP_STAGING=false
SETUP_PRODUCTION=false

case $ENV_CHOICE in
    1) SETUP_STAGING=true ;;
    2) SETUP_PRODUCTION=true ;;
    3) SETUP_STAGING=true; SETUP_PRODUCTION=true ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "${BLUE}This script will help you create environment configuration files.${NC}"
echo -e "${YELLOW}Press Enter to use the default value shown in [brackets].${NC}"
echo ""

# Function to read input with default
read_with_default() {
    local prompt="$1"
    local default="$2"
    local value
    
    echo -ne "${BLUE}${prompt}${NC}"
    if [ -n "$default" ]; then
        echo -ne " ${YELLOW}[${default}]${NC}"
    fi
    echo -n ": "
    
    read -r value
    if [ -z "$value" ] && [ -n "$default" ]; then
        echo "$default"
    else
        echo "$value"
    fi
}

# Function to read password (hidden input)
read_password() {
    local prompt="$1"
    local value
    
    echo -ne "${BLUE}${prompt}${NC}: "
    read -rs value
    echo ""
    echo "$value"
}

# Function to generate a secure random password
generate_password() {
    LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c 24
}

# =====================
# SHARED CONFIGURATION
# =====================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Shared Configuration (applies to both environments)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

VERSION=$(read_with_default "Version" "latest")

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Container Registry Configuration${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

REGISTRY_URL=$(read_with_default "Registry URL" "quay.myandi.de")
REGISTRY_USER=$(read_with_default "Registry Username" "gherold")

echo ""
echo -e "${YELLOW}Registry Password (will be hidden)${NC}"
REGISTRY_PASSWORD=$(read_password "Registry Password")
if [ -z "$REGISTRY_PASSWORD" ]; then
    echo -e "${YELLOW}⚠ Warning: No registry password provided.${NC}"
    echo -e "${YELLOW}   You'll need to login manually or add it to environment files later.${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}API Keys and Secrets (shared)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

API_KEY=$(read_with_default "Gemini API Key" "")

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Email Configuration (shared)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MAILJET_API_KEY=$(read_with_default "Mailjet API Key" "")
MAILJET_SECRET_KEY=$(read_with_default "Mailjet Secret Key" "")
MAILJET_SENDER_EMAIL=$(read_with_default "Mailjet Sender Email" "register@manualmode.at")

if [ -z "$MAILJET_API_KEY" ] || [ -z "$MAILJET_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠ Warning: Mailjet not configured. Email features will not work!${NC}"
fi

# ================================
# ENVIRONMENT-SPECIFIC CONFIGURATION
# ================================

create_env_file() {
    local ENV_NAME=$1
    local ENV_TYPE=$2
    local DB_NAME=$3
    local FRONTEND_URL=$4
    local ENV_FILE=".env.${ENV_NAME}"
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Configuring ${ENV_TYPE} Environment${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check if file exists
    if [ -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠ Warning: $ENV_FILE already exists!${NC}"
        read -p "Overwrite? (yes/no): " -r
        if [[ ! $REPLY =~ ^yes$ ]]; then
            echo -e "${YELLOW}Skipping $ENV_TYPE environment${NC}"
            return
        fi
    fi
    
    # Database configuration
    DB_USER=$(read_with_default "Database User" "mcuser")
    
    echo ""
    echo -e "${YELLOW}Database Passwords (will be hidden, auto-generated if empty)${NC}"
    DB_PASSWORD=$(read_password "Database User Password")
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(generate_password)
        echo -e "${GREEN}✓ Generated DB user password: ${DB_PASSWORD}${NC}"
    fi
    
    DB_ROOT_PASSWORD=$(read_password "Database Root Password")
    if [ -z "$DB_ROOT_PASSWORD" ]; then
        DB_ROOT_PASSWORD=$(generate_password)
        echo -e "${GREEN}✓ Generated DB root password: ${DB_ROOT_PASSWORD}${NC}"
    fi
    
    # JWT Secret
    echo ""
    echo -e "${YELLOW}JWT Secret (auto-generated if empty)${NC}"
    JWT_SECRET=$(read_password "JWT Secret")
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(generate_password)$(generate_password)
        echo -e "${GREEN}✓ Generated JWT secret${NC}"
    fi
    
    # Admin account
    echo ""
    INITIAL_ADMIN_EMAIL=$(read_with_default "Admin Email" "admin@manualmode.at")
    
    echo -e "${YELLOW}Admin Password (auto-generated if empty)${NC}"
    INITIAL_ADMIN_PASSWORD=$(read_password "Admin Password")
    if [ -z "$INITIAL_ADMIN_PASSWORD" ]; then
        INITIAL_ADMIN_PASSWORD=$(generate_password)
        echo -e "${GREEN}✓ Generated admin password: ${INITIAL_ADMIN_PASSWORD}${NC}"
    fi
    
    # Create the environment file
    echo ""
    echo -e "${GREEN}Creating $ENV_FILE...${NC}"
    
    cat > "$ENV_FILE" << EOF
# ${ENV_TYPE} Server Environment Configuration
# Generated on $(date)
# DO NOT commit this file to git!

# Version
VERSION=${VERSION}

# Container Registry Configuration
REGISTRY_URL=${REGISTRY_URL}
REGISTRY_USER=${REGISTRY_USER}
REGISTRY_PASSWORD=${REGISTRY_PASSWORD}

# Database Configuration (MariaDB)
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_NAME=${DB_NAME}

# Application URLs
ENVIRONMENT_TYPE=${ENV_NAME}
FRONTEND_URL=${FRONTEND_URL}

# API Keys and Secrets
API_KEY=${API_KEY}
JWT_SECRET=${JWT_SECRET}

# Mailjet Configuration (for email)
MAILJET_API_KEY=${MAILJET_API_KEY}
MAILJET_SECRET_KEY=${MAILJET_SECRET_KEY}
MAILJET_SENDER_EMAIL=${MAILJET_SENDER_EMAIL}

# Admin Configuration
INITIAL_ADMIN_EMAIL=${INITIAL_ADMIN_EMAIL}
INITIAL_ADMIN_PASSWORD=${INITIAL_ADMIN_PASSWORD}
EOF

    echo -e "${GREEN}✓ $ENV_FILE created successfully!${NC}"
    
    # Save credentials to summary
    cat >> .env.summary << EOF

${ENV_TYPE} Environment:
  Database User: ${DB_USER}
  Database Password: ${DB_PASSWORD}
  Database Root Password: ${DB_ROOT_PASSWORD}
  JWT Secret: ${JWT_SECRET:0:20}...
  Admin Email: ${INITIAL_ADMIN_EMAIL}
  Admin Password: ${INITIAL_ADMIN_PASSWORD}
  Frontend URL: ${FRONTEND_URL}
  Database Name: ${DB_NAME}

EOF
}

# Initialize summary file
cat > .env.summary << EOF
Alternative Server Configuration Summary
Generated on $(date)

⚠ IMPORTANT: Save these credentials securely and delete this file!

Shared Configuration:
  Registry: ${REGISTRY_URL}
  Registry User: ${REGISTRY_USER}
  Registry Password: ${REGISTRY_PASSWORD:0:20}...
  Gemini API Key: ${API_KEY:0:20}...
  Mailjet API Key: ${MAILJET_API_KEY:0:20}...

EOF

# Create staging environment
if [ "$SETUP_STAGING" = true ]; then
    create_env_file "staging" "Staging" "meaningful_conversations_staging" "http://46.224.37.130:8080"
fi

# Create production environment
if [ "$SETUP_PRODUCTION" = true ]; then
    create_env_file "production" "Production" "meaningful_conversations_production" "http://46.224.37.130"
fi

# Final summary
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                                       ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}✓ Configuration files created:${NC}"
if [ "$SETUP_STAGING" = true ]; then
    echo -e "  • .env.staging"
fi
if [ "$SETUP_PRODUCTION" = true ]; then
    echo -e "  • .env.production"
fi
echo -e "  • .env.summary (credentials backup)"

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠ SECURITY NOTICE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${RED}1. Save your credentials from .env.summary to a secure location${NC}"
echo -e "${RED}2. Delete .env.summary after saving: ${YELLOW}rm .env.summary${NC}"
echo -e "${RED}3. Never commit .env.staging or .env.production to git${NC}"

if [ -z "$API_KEY" ]; then
    echo ""
    echo -e "${RED}⚠ ACTION REQUIRED:${NC}"
    echo -e "${YELLOW}  Add your Gemini API key to the environment files:${NC}"
    if [ "$SETUP_STAGING" = true ]; then
        echo -e "${YELLOW}  • Edit .env.staging and set API_KEY=your_actual_key${NC}"
    fi
    if [ "$SETUP_PRODUCTION" = true ]; then
        echo -e "${YELLOW}  • Edit .env.production and set API_KEY=your_actual_key${NC}"
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Next Steps:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "1. ${BLUE}Review your configuration:${NC}"
if [ "$SETUP_STAGING" = true ]; then
    echo -e "   cat .env.staging"
fi
if [ "$SETUP_PRODUCTION" = true ]; then
    echo -e "   cat .env.production"
fi
echo ""
echo -e "2. ${BLUE}Deploy to alternative server:${NC}"
if [ "$SETUP_STAGING" = true ]; then
    echo -e "   make deploy-alternative-staging"
fi
if [ "$SETUP_PRODUCTION" = true ]; then
    echo -e "   make deploy-alternative-production"
fi
echo ""
echo -e "3. ${BLUE}Monitor deployment:${NC}"
if [ "$SETUP_STAGING" = true ]; then
    echo -e "   make logs-alternative-staging"
fi
if [ "$SETUP_PRODUCTION" = true ]; then
    echo -e "   make logs-alternative-production"
fi
echo ""
echo -e "4. ${BLUE}Secure your credentials and delete the summary:${NC}"
echo -e "   rm .env.summary"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""

# Cleanup note for old .env.alternative
if [ -f .env.alternative ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠ MIGRATION NOTICE${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Old .env.alternative file detected!${NC}"
    echo -e "${YELLOW}The system now uses separate .env.staging and .env.production files.${NC}"
    echo -e "${YELLOW}You can safely delete .env.alternative after migrating:${NC}"
    echo -e "  ${BLUE}rm .env.alternative${NC}"
    echo ""
fi
