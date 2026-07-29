#!/bin/bash
################################################################################
# macOS Podman VM preflight for local image builds (deploy-manualmode.sh).
#
# On macOS, Podman runs in an Apple HV VM. The VM may report "running" while
# the local SSH socket (127.0.0.1:63947) is still refusing connections — especially
# after sleep, crash mid-build, or starting the machine in a different shell.
#
# This script starts the machine if needed, waits for podman info, and restarts
# once if the socket is still unreachable.
################################################################################

ensure_local_podman() {
    # Linux servers and WSL use native Podman — no local VM.
    if [[ "$(uname -s)" != "Darwin" ]]; then
        return 0
    fi

    if ! command -v podman >/dev/null 2>&1; then
        echo "podman not found — install with: brew install podman podman-compose"
        return 1
    fi

    if ! podman machine list >/dev/null 2>&1; then
        echo "podman machine unavailable — check Podman Desktop or brew install podman"
        return 1
    fi

    local machine_count
    machine_count=$(podman machine list --format '{{.Name}}' 2>/dev/null | grep -c . || true)
    if [[ "$machine_count" -eq 0 ]]; then
        echo "No Podman machine — run: podman machine init && podman machine start"
        return 1
    fi

    _podman_socket_ready() {
        podman info >/dev/null 2>&1
    }

    _wait_for_podman() {
        local max_attempts=$1
        local attempt=1
        while [[ $attempt -le $max_attempts ]]; do
            if _podman_socket_ready; then
                return 0
            fi
            sleep 2
            attempt=$((attempt + 1))
        done
        return 1
    }

    _start_podman_machine() {
        local state
        state=$(podman machine inspect --format '{{.State}}' 2>/dev/null || echo "unknown")
        if [[ "$state" != "running" ]]; then
            echo "Starting Podman machine (was: ${state})..."
            podman machine start
        fi
    }

    _start_podman_machine

    if _wait_for_podman 15; then
        return 0
    fi

    echo "Podman socket not ready — restarting machine..."
    podman machine stop >/dev/null 2>&1 || true
    sleep 2
    podman machine start

    if _wait_for_podman 15; then
        return 0
    fi

    echo "Cannot connect to Podman after restart."
    echo "Manual fix: podman machine stop && podman machine start && podman ps"
    echo "See DOCUMENTATION/PODMAN-GUIDE.md (macOS Podman VM before deploy)"
    return 1
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    ensure_local_podman
    exit $?
fi
