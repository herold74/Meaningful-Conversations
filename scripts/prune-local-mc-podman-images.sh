#!/usr/bin/env bash
################################################################################
# Retain only the newest local Meaningful Conversations Podman images before deploy builds.
#
# Default: keep the 2 newest semver tags per MC component (backend, frontend, tts).
# :latest is kept implicitly (same image ID as a kept semver tag after deploy).
# Current package VERSION is always kept when passed as protect_version.
# Then removes older semver tags and runs `podman image prune -f` for dangling layers.
#
# Does NOT run `podman system prune -af` — other projects' images are untouched.
#
# Invoked automatically from deploy-manualmode.sh (see DOCUMENTATION/PODMAN-GUIDE.md).
################################################################################

_MC_TAG_IN_LIST() {
    local needle="$1"
    shift
    local t
    for t in "$@"; do
        [[ "$t" == "$needle" ]] && return 0
    done
    return 1
}

prune_local_mc_podman_images() {
    local keep_count="${1:-2}"
    local registry_url="${2:-}"
    local image_prefix="${3:-}"
    local protect_version="${4:-}"

    if ! command -v podman >/dev/null 2>&1; then
        return 0
    fi
    if ! podman info >/dev/null 2>&1; then
        return 0
    fi

    if [[ -z "$registry_url" || -z "$image_prefix" ]]; then
        echo "prune_local_mc_podman_images: registry_url and image_prefix required" >&2
        return 1
    fi

    if ! [[ "$keep_count" =~ ^[0-9]+$ ]] || [[ "$keep_count" -lt 1 ]]; then
        echo "prune_local_mc_podman_images: keep_count must be a positive integer" >&2
        return 1
    fi

    local components=(
        meaningful-conversations-backend
        meaningful-conversations-frontend
        meaningful-conversations-tts
    )

    local removed=0
    local comp repo ref tag
    local -a semver_tags=()
    local -a sorted=()
    local -a keep_tags=()
    local i n drop_tag

    for comp in "${components[@]}"; do
        repo="${registry_url}/${image_prefix}/${comp}"
        semver_tags=()

        while IFS= read -r ref; do
            [[ -z "$ref" ]] && continue
            tag="${ref##*:}"
            if [[ "$tag" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.+~-]+)?$ ]]; then
                semver_tags+=("$tag")
            fi
        done < <(podman images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -F "${repo}:" || true)

        if [[ ${#semver_tags[@]} -eq 0 ]]; then
            continue
        fi

        sorted=()
        while IFS= read -r tag; do
            sorted+=("$tag")
        done < <(printf '%s\n' "${semver_tags[@]}" | sort -ruV)

        keep_tags=()
        i=0
        for tag in "${sorted[@]}"; do
            keep_tags+=("$tag")
            i=$((i + 1))
            [[ $i -ge $keep_count ]] && break
        done

        if [[ -n "$protect_version" ]] && _MC_TAG_IN_LIST "$protect_version" "${semver_tags[@]}"; then
            if ! _MC_TAG_IN_LIST "$protect_version" "${keep_tags[@]}"; then
                if [[ ${#keep_tags[@]} -ge $keep_count ]]; then
                    drop_tag="${keep_tags[$((keep_count - 1))]}"
                    keep_tags=("${keep_tags[@]:0:$((keep_count - 1))}")
                fi
                keep_tags+=("$protect_version")
            fi
        fi

        for tag in "${semver_tags[@]}"; do
            if _MC_TAG_IN_LIST "$tag" "${keep_tags[@]}"; then
                continue
            fi
            if podman rmi "${repo}:${tag}" >/dev/null 2>&1; then
                echo "  removed ${comp}:${tag}"
                removed=$((removed + 1))
            fi
        done
    done

    podman image prune -f >/dev/null 2>&1 || true

    if [[ $removed -gt 0 ]]; then
        echo "Pruned $removed old local MC image tag(s); kept up to $keep_count semver build(s) per component."
    else
        echo "No old local MC image tags to prune (retention: $keep_count build(s) per component)."
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    # shellcheck source=scripts/registry-env.sh
    source "$SCRIPT_DIR/registry-env.sh"
    if [[ -f "$SCRIPT_DIR/../.env.staging" ]]; then
        load_registry_env "$SCRIPT_DIR/../.env.staging"
    fi
    protect_version="${1:-$(grep -m1 '"version"' "$SCRIPT_DIR/../package.json" | awk -F'"' '{print $4}')}"
    prune_local_mc_podman_images 2 "${REGISTRY_URL:-}" "${REGISTRY_IMAGE_PREFIX:-gherold/meaningful-conversations}" "$protect_version"
fi
