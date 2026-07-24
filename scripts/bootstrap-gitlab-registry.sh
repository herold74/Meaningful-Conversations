#!/bin/bash
################################################################################
# Bootstrap GitLab Container Registry — create the three image repos by pushing
# meaningful-conversations-{backend,frontend,tts} (repos appear on first push).
#
# Usage:
#   1. Fill REGISTRY_PASSWORD in .env.staging (GitLab PAT or deploy token)
#   2. ./scripts/bootstrap-gitlab-registry.sh [VERSION]
#
# Sources images from local podman cache, or pulls from legacy Quay if missing.
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# shellcheck source=registry-env.sh
source "$SCRIPT_DIR/registry-env.sh"

ENV_FILE=".env.staging"
VERSION="${1:-$(grep -m1 '"version"' package.json | awk -F'"' '{print $4}')}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

load_registry_env "$ENV_FILE"

if [[ "$REGISTRY_URL" != regy.rhepds.com* ]] && [[ "$REGISTRY_URL" != *regy.rhepds.com ]]; then
    echo -e "${YELLOW}Warning: REGISTRY_URL is '$REGISTRY_URL' (expected regy.rhepds.com for this GitLab instance)${NC}"
fi

echo -e "${GREEN}=== Bootstrap GitLab registry ===${NC}"
echo "  Registry:  $REGISTRY_URL"
echo "  Prefix:    $REGISTRY_IMAGE_PREFIX"
echo "  Login as:  $REGISTRY_LOGIN_USER"
echo "  Version:   $VERSION"
echo ""

echo -e "${YELLOW}Logging in to $REGISTRY_URL...${NC}"
registry_login_from_env "$ENV_FILE"
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

LEGACY_REGISTRY="quay.myandi.de/gherold"
COMPONENTS=(backend frontend tts)

for component in "${COMPONENTS[@]}"; do
    target="$(registry_image_ref "$component" "$VERSION")"
    target_latest="$(registry_image_ref "$component" "latest")"
    legacy="${LEGACY_REGISTRY}/meaningful-conversations-${component}:${VERSION}"

    echo -e "${YELLOW}→ meaningful-conversations-${component}${NC}"

    if podman inspect --type image "$target" >/dev/null 2>&1; then
        echo "  Using existing local tag: $target"
    elif podman inspect --type image "${LEGACY_REGISTRY}/meaningful-conversations-${component}:${VERSION}" >/dev/null 2>&1; then
        echo "  Retagging from legacy Quay: $legacy"
        podman tag "$legacy" "$target"
    else
        echo "  Pulling from legacy Quay: $legacy"
        if ! podman pull --tls-verify=false "$legacy"; then
            echo -e "${RED}  No local image and Quay pull failed for $component${NC}"
            echo "  Build first: ./deploy-manualmode.sh -e staging -c $component --skip-push"
            exit 1
        fi
        podman tag "$legacy" "$target"
    fi

    podman tag "$target" "$target_latest"
    echo "  Pushing $target"
    podman push "$target"
    echo "  Pushing $target_latest"
    podman push "$target_latest"
    echo -e "${GREEN}  ✓ meaningful-conversations-${component} created${NC}"
    echo ""
done

echo -e "${GREEN}=== Done — three registry repos are live ===${NC}"
echo "  https://git.rhepds.com/gherold/meaningful-conversations/container_registry"
