#!/usr/bin/env bash
# Block server deploy/SSH ops from Cursor Cloud, CI, or env-only SERVER_HOST injection.
# Maintainer Mac: copy .env.server.example → .env.server (gitignored).
set -euo pipefail

_maintainer_deploy_guard() {
    local repo_root="${1:?repo root required}"

    if [[ "${MC_SERVER_DEPLOY_FORBIDDEN:-}" == "1" ]]; then
        echo "ERROR: Server deploy is disabled in this environment (Cursor Cloud / forbidden profile)." >&2
        echo "Deploy only from the maintainer machine with .env.server and your SSH tunnel." >&2
        exit 1
    fi

    local env_file="$repo_root/.env.server"
    if [[ ! -f "$env_file" ]]; then
        echo "ERROR: Missing $env_file — server deploy is maintainer-local only (file is gitignored)." >&2
        echo "Cloud Agents and CI cannot deploy. Set SERVER_HOST only in .env.server on your Mac, not in Cloud Secrets." >&2
        exit 1
    fi
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    ROOT="$(cd "$(dirname "$0")/.." && pwd)"
    _maintainer_deploy_guard "$ROOT"
fi