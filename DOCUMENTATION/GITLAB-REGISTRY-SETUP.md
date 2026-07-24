# GitLab Container Registry Setup

Meaningful Conversations images are stored in the GitLab project registry:

**Web UI:** https://git.rhepds.com/gherold/meaningful-conversations/container_registry  
**Registry host (push/pull):** `regy.rhepds.com` — GitLab exposes the API on this host, not `git.rhepds.com`.

## Image names

| Component | Full image reference |
|-----------|----------------------|
| Backend | `regy.rhepds.com/gherold/meaningful-conversations/meaningful-conversations-backend:VERSION` |
| Frontend | `regy.rhepds.com/gherold/meaningful-conversations/meaningful-conversations-frontend:VERSION` |
| TTS | `regy.rhepds.com/gherold/meaningful-conversations/meaningful-conversations-tts:VERSION` |

GitLab creates each repository on **first push** (no manual repo creation needed).

## Environment variables (`.env.staging` / `.env.production`)

```bash
REGISTRY_URL=regy.rhepds.com
REGISTRY_LOGIN_USER=gherold@redhat.com
REGISTRY_IMAGE_PREFIX=gherold/meaningful-conversations
REGISTRY_PASSWORD=<GitLab PAT or deploy token>
```

- **`REGISTRY_LOGIN_USER`** — GitLab account email or username for `podman login`
- **`REGISTRY_IMAGE_PREFIX`** — project path (`namespace/project`)
- **`REGISTRY_PASSWORD`** — Personal Access Token or Deploy Token with `read_registry` + `write_registry`

### Create credentials

1. **Deploy token (recommended):** Project → Settings → Repository → Deploy tokens  
   - Scopes: `read_registry`, `write_registry`
2. **PAT:** User Settings → Access tokens — scopes `read_registry`, `write_registry`

## Login

```bash
podman login regy.rhepds.com -u gherold@redhat.com
# paste token when prompted for password
```

On the server (staging/production):

```bash
ssh root@$SERVER_HOST
cd /opt/manualmode-staging   # or manualmode-production
podman login regy.rhepds.com -u gherold@redhat.com
```

## Bootstrap the three image repos (one-time)

After filling `REGISTRY_PASSWORD` in `.env.staging`:

```bash
./scripts/bootstrap-gitlab-registry.sh
```

This retags existing local (or legacy Quay) images and pushes `backend`, `frontend`, and `tts` to GitLab.

## Deploy workflow

Unchanged — registry vars are loaded automatically:

```bash
./deploy-manualmode.sh -e staging -c app
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Check PAT/deploy token scopes and expiry |
| `denied: access forbidden` | Token must have registry read/write on this project |
| Server pull fails | Run `podman login` on server; verify `.env` has new `REGISTRY_*` vars |
| Old Quay images still used | Re-deploy after bootstrap; check `podman-compose` uses `REGISTRY_IMAGE_PREFIX` |

## Legacy Quay

Previous registry: `quay.myandi.de/gherold/...` (deprecated). See archived `QUAY-REGISTRY-SETUP.md`.
