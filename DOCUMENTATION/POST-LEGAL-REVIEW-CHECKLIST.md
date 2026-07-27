# Post–Legal Review Checklist (v2.4.0 taxonomy)

After legal approval for public Git history cleanup and deploy.

## 1. Git history (one-time)

```bash
# Install: pip install git-filter-repo
git filter-repo --replace-text scripts/git-filter-repo-replacements.txt --force

# Re-tag v2.x if tags must point to rewritten commits (adjust SHAs after filter)
# git push --force-with-lease origin main --tags
```

Verify:

```bash
git log -p --all -S 'sam-forward-focused' | head
git log -p --all -S 'forward-focused tradition' | head
```

## 2. Staging deploy

1. Push `main` (after force push if history was rewritten)
2. Run DB migration on staging:
   ```bash
   node scripts/migrate-method-ids.js
   ```
3. Deploy app per `DOCUMENTATION/` deployment skill (v2.4.0)
4. Smoke: Bot Selection (Sam, Gabrielle, Mike), Coach Practice default pair, IAP Kenji/Chloe unlock IDs

## 3. Production

Repeat migration + deploy after staging sign-off.

## 4. Remove legacy aliases (when obsolete)

**Vermerk:** Aliases are **temporary** — remove when App Store ≥2.4.x, production migrated, and DB has no legacy IDs. Full criteria and checklist:

→ **`DOCUMENTATION/LEGACY-ALIASES-REMOVAL.md`**

Then remove `LEGACY_*_ALIASES` from `practice/methodTaxonomy.js` (target e.g. v2.5.0).
