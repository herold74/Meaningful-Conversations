# Version Management Guide

## 🎯 Quick Command

```bash
make update-version
```

Enter the new version (e.g., `1.4.9`) and it will update **everywhere** automatically.

---

## 📍 Where Version is Updated

When you run `make update-version`, it updates these **6 locations**:

### 1️⃣ `package.json`
```json
{
  "version": "1.4.9"  ← Updated here
}
```
**Why:** Used by Docker build to tag images

---

### 2️⃣ `meaningful-conversations-backend/package.json`
```json
{
  "version": "1.4.9"  ← Updated here
}
```
**Why:** Backend version, Docker image tag

---

### 3️⃣ `public/sw.js` (Service Worker)
```javascript
const CACHE_NAME = 'meaningful-conversations-cache-v1.4.9-pwa-fix';  ← Updated here
```
**Why:** Forces browsers to reload all cached files (critical for PWA updates!)

---

### 4️⃣ `components/BurgerMenu.tsx`
```tsx
<p className="text-xs text-center text-content-subtle">
    Version 1.4.9  ← Updated here
</p>
```
**Why:** Displayed at bottom of menu so users see current version

---

### 5️⃣ `components/AboutView.tsx`
```tsx
<p className="text-sm text-content-subtle">
    {t('about_version')} 1.4.9  ← Updated here
</p>
```
**Why:** Displayed on About page

---

### 6️⃣ `metadata.json`
```json
{
  "name": "Meaningful Conversations 1.4.9_stream"  ← Updated here
}
```
**Why:** App metadata

---

## 🔄 Typical Workflow

### When Making a Release:

```bash
# 1. Make your code changes
# 2. Update version everywhere
make update-version
# Enter: 1.4.9

# 3. Check what was updated
git diff

# 4. Commit version changes
git add .
git commit -m "Bump version to 1.4.9"

# 5. Deploy to staging
make deploy-staging

# 6. Test staging thoroughly

# 7. Deploy to production
make deploy-production

# 8. Tag the release
git tag v1.4.9
git push origin v1.4.9
```

---

## 🔍 Check Current Version

```bash
# Quick check
make version

# Or manually
cat package.json | grep version
```

---

## ⚠️ Important Notes

### Service Worker Cache
**Most Important:** Changing the version in `sw.js` creates a new cache name. This forces all users' browsers to:
- Download fresh copies of all files
- Clear old cached data
- Install the new Service Worker

Without this, users might keep using old cached versions of your app!

### Docker Image Tags
The version from `package.json` becomes your Docker image tag:
```
europe-west6-docker.pkg.dev/.../frontend:1.4.9
```

This allows easy rollback:
```bash
# Rollback to previous version
./deploy-auto.sh -e production -v 1.4.8
```

### Semantic Versioning
Follow [SemVer](https://semver.org/):
- **Major (1.x.x)**: Breaking changes
- **Minor (x.4.x)**: New features, backwards compatible
- **Patch (x.x.9)**: Bug fixes only

Examples:
- `1.4.9` → `1.4.10`: Bug fix
- `1.4.10` → `1.5.0`: New feature
- `1.5.0` → `2.0.0`: Breaking change

---

## 🚨 Manual Update (Not Recommended)

If you need to manually update version for some reason:

```bash
# Frontend
sed -i '' 's/"version": "[^"]*"/"version": "1.4.9"/' package.json

# Backend
sed -i '' 's/"version": "[^"]*"/"version": "1.4.9"/' meaningful-conversations-backend/package.json

# Service Worker
sed -i '' 's/cache-v[^-]*-pwa-fix/cache-v1.4.9-pwa-fix/' public/sw.js

# UI Components
sed -i '' 's/Version [0-9.]*/Version 1.4.9/' components/BurgerMenu.tsx
sed -i '' "s/about_version')} [0-9.]*/about_version')} 1.4.9/" components/AboutView.tsx

# Metadata
sed -i '' 's/Meaningful Conversations [0-9.]*/Meaningful Conversations 1.4.9/' metadata.json
```

**But really, just use `make update-version` - it's safer!** ✅

---

## 📊 Version History

Keep track of your versions in git:

```bash
# See all version tags
git tag

# See what changed in a version
git log v1.4.8..v1.4.9 --oneline

# Compare two versions
git diff v1.4.8 v1.4.9
```

---

## ✅ Best Practices

1. **Always update version before deploying major changes**
2. **Use semantic versioning** (Major.Minor.Patch)
3. **Commit version changes separately** from feature changes
4. **Tag releases in git** for easy rollback
5. **Document changes** in a CHANGELOG.md (optional but recommended)
6. **Test staging** before updating production version
7. **Don't skip versions** - go 1.4.8 → 1.4.9, not 1.4.8 → 1.5.0 for a bug fix

---

## 🎉 Summary

**One command updates everything:**
```bash
make update-version
```

**It's automatic, safe, and consistent!** 🚀

