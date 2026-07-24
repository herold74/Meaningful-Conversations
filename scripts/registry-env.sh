#!/bin/bash
# Shared container registry helpers (Quay legacy + GitLab Container Registry).
# Source from deploy scripts after loading .env.staging / .env.production.

load_registry_env() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        # shellcheck disable=SC2046
        export $(grep -E '^REGISTRY_URL=|^REGISTRY_USER=|^REGISTRY_LOGIN_USER=|^REGISTRY_IMAGE_PREFIX=|^REGISTRY_PASSWORD=' "$env_file" | xargs)
    fi

    REGISTRY_URL="${REGISTRY_URL:-localhost}"
    REGISTRY_USER="${REGISTRY_USER:-gherold}"
    REGISTRY_LOGIN_USER="${REGISTRY_LOGIN_USER:-gherold@redhat.com}"
    REGISTRY_IMAGE_PREFIX="${REGISTRY_IMAGE_PREFIX:-gherold/meaningful-conversations}"
}

registry_image_ref() {
    local component="$1"
    local tag="$2"
    echo "${REGISTRY_URL}/${REGISTRY_IMAGE_PREFIX}/meaningful-conversations-${component}:${tag}"
}

registry_login_from_env() {
    local env_file="$1"
    if [[ ! -f "$env_file" ]]; then
        return 1
    fi
    # shellcheck disable=SC2046
    export $(grep -E '^REGISTRY_URL=|^REGISTRY_LOGIN_USER=|^REGISTRY_USER=|^REGISTRY_PASSWORD=' "$env_file" | xargs)
    REGISTRY_LOGIN_USER="${REGISTRY_LOGIN_USER:-gherold@redhat.com}"
    if [[ -z "${REGISTRY_PASSWORD:-}" ]]; then
        echo "REGISTRY_PASSWORD is not set in $env_file" >&2
        return 1
    fi
    echo "$REGISTRY_PASSWORD" | podman login "$REGISTRY_URL" -u "$REGISTRY_LOGIN_USER" --password-stdin
}
