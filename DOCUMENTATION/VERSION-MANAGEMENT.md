# Version Management Guide

## 🎯 Quick Commands

```bash
# Update version (new minor/major release)
make update-version    # Enter: 1.7.9

# Increment build number only (same version)
# Edit BUILD_NUMBER file manually, then update sw.js
```

---

## 📍 Where Version is Updated

When you run `make update-version`, it updates these **5 locations**:

### 1️⃣ `package.json`
```json
{
  "version": "1.7.9"  ← Updated here
}
```
**Why:** Source of truth for version

---

### 2️⃣ `meaningful-conversations-backend/package.json`
```json
{
  "version": "1.7.9"  ← Updated here
}
```
**Why:** Backend version, Docker image tag

---

### 3️⃣ `public/sw.js` (Service Worker)
```javascript
const CACHE_NAME = 'meaningful-conversations-cache-v1.7.9-b1';  ← Updated here
```
**Why:** Forces browsers to reload all cached files (critical for PWA updates!)

---

### 4️⃣ `components/AboutView.tsx`
```tsx
<p className="text-sm text-content-subtle">
    {t('about_version')} 1.7.9  ← Updated here
</p>
```
**Why:** Displayed on About page

---

### 5️⃣ `metadata.json`
```json
{
  "name": "Meaningful Conversations 1.7.9_stream"  ← Updated here
}
```
**Why:** App metadata

---

### 6️⃣ `BUILD_NUMBER` (Reset to 1)
```
1
```
**Why:** New version starts with Build 1

---

## 🔢 Build Number System

Each version has a **build number** that increments with each deployment:

- **Version:** `1.7.9` (from `package.json`)
- **Build:** `13` (from `BUILD_NUMBER` file)
- **Display:** `Version 1.7.9 (Build 13)`
- **SW Cache:** `v1.7.9-b13`

### ⚠️ Important Rules

1. **New Version = Build 1**
   ```
   1.7.8 (Build 39) → 1.7.9 (Build 1)  ✅
   1.7.8 (Build 39) → 1.7.9 (Build 40) ❌
   ```

2. **Same Version = Increment Build**
   ```
   Before deploy: Edit BUILD_NUMBER (12 → 13)
   Update sw.js:  v1.7.9-b12 → v1.7.9-b13
   ```

---

## 🔄 Typical Workflows

### New Version Release

```bash
# 1. Update version everywhere
make update-version
# Enter: 1.7.9

# 2. Check changes
git diff

# 3. Commit
git add .
git commit -m "Bump version to 1.7.9"

# 4. Deploy to staging
./deploy-manualmode.sh -e staging -c frontend

# 5. Test thoroughly

# 6. Deploy to production
./deploy-manualmode.sh -e production -c frontend

# 7. Tag release
git tag v1.7.9
git push origin v1.7.9
```

### Bug Fix (Same Version)

```bash
# 1. Make code changes

# 2. Increment build number
echo "14" > BUILD_NUMBER

# 3. Update service worker cache
# In public/sw.js: v1.7.9-b13 → v1.7.9-b14

# 4. Commit
git add .
git commit -m "Fix: description (Build 14)"

# 5. Deploy
./deploy-manualmode.sh -e staging -c frontend
```

---

## 🔍 Check Current Version

```bash
# Frontend version
cat package.json | grep '"version"'

# Build number
cat BUILD_NUMBER

# Service worker cache
head -1 public/sw.js
```

---

## ⚠️ Important Notes

### Service Worker Cache
Changing the cache name in `sw.js` forces all users' browsers to:
- Download fresh copies of all files
- Clear old cached data
- Install the new Service Worker

Without this, users might keep using old cached versions!

### Docker Image Tags
The version from `package.json` becomes your Docker image tag:
```
quay.myandi.de/gherold/meaningful-conversations-frontend:1.7.9
```

### Semantic Versioning
Follow [SemVer](https://semver.org/):
- **Major (2.x.x)**: Breaking changes
- **Minor (x.8.x)**: New features, backwards compatible
- **Patch (x.x.10)**: Bug fixes only

---

## 🚨 Manual Update (If Needed)

```bash
# Frontend package.json
sed -i '' 's/"version": "[^"]*"/"version": "1.7.9"/' package.json

# Backend package.json
sed -i '' 's/"version": "[^"]*"/"version": "1.7.9"/' meaningful-conversations-backend/package.json

# Service Worker (with build number)
sed -i '' 's/cache-v[^'"'"']*/cache-v1.7.9-b1/' public/sw.js

# About page
sed -i '' "s/about_version')} [0-9.]*/about_version')} 1.7.9/" components/AboutView.tsx

# Metadata
sed -i '' 's/Meaningful Conversations [0-9.]*/Meaningful Conversations 1.7.9/' metadata.json

# Build number
echo "1" > BUILD_NUMBER
```

**But really, just use `make update-version` - it's safer!** ✅

---

## ✅ Best Practices

1. **Always update version before major deployments**
2. **Use semantic versioning** (Major.Minor.Patch)
3. **Increment build number for every staging deploy**
4. **Tag releases in git** for easy rollback
5. **Test staging thoroughly** before production
6. **Don't skip versions** - go 1.7.9 → 1.7.10, not 1.7.9 → 1.8.0 for a bug fix

---

## 🎉 Summary

**New version:**
```bash
make update-version
```

**Same version, new build:**
```bash
# Edit BUILD_NUMBER
# Update sw.js cache name
```

**Deploy:**
```bash
./deploy-manualmode.sh -e staging -c frontend
```