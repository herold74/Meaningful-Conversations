# Local Development - Database Migrations Guide

> **Guide for managing Prisma database migrations in local development environment**

## 🎯 Quick Reference

### Standard Migration Flow (Happy Path)

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create and apply migration
cd meaningful-conversations-backend
npx prisma migrate dev --name descriptive_migration_name

# 3. Verify status
npx prisma migrate status
```

**Expected Output:**
```
Database schema is up to date!
```

---

## 🚨 Troubleshooting: Shadow Database Errors

### Problem: "Migration failed to apply cleanly to the shadow database"

**Symptoms:**
```
Error: P3006
Migration `XXXXX` failed to apply cleanly to the shadow database.
Error code: P3018
Database error: Table 'prisma_migrate_shadow_db_XXX.user' doesn't exist
```

**Cause:**
- Migration history in `prisma/migrations/` doesn't match actual database state
- Previous migrations were applied manually or via `db push` without updating migration history
- Migration files contain case-sensitive table names that don't match actual database

### Solution: Sync Schema and Resolve Migration History

#### Step 1: Force Sync Schema to Database

```bash
cd meaningful-conversations-backend
npx prisma db push --skip-generate
```

**What this does:**
- Applies current schema directly to database (bypasses migration system)
- Creates missing tables
- Does NOT create migration files
- Does NOT update migration history

#### Step 2: Check Migration Status

```bash
npx prisma migrate status
```

**Example Output:**
```
16 migrations found in prisma/migrations
Following migrations have not yet been applied:
20251101000000_init
20251106_add_api_usage
...
Following migration have failed:
20250109120000_add_coaching_mode
```

#### Step 3: Mark Existing Migrations as Applied

For **unapplied migrations** (tables already exist in DB):

```bash
# Mark each migration as applied
npx prisma migrate resolve --applied 20251101000000_init
npx prisma migrate resolve --applied 20251106_add_api_usage
# ... repeat for all unapplied migrations
```

For **failed migrations** (table already exists, marked as failed):

```bash
npx prisma migrate resolve --applied 20250109120000_add_coaching_mode
```

**Verification:**
```bash
npx prisma migrate status
# Should show: "Database schema is up to date!"
```

#### Step 4: Create New Migration (If Needed)

If you added new models/fields to the schema:

**Option A: Let Prisma Try (may fail with shadow DB error)**
```bash
npx prisma migrate dev --name add_your_feature
```

**Option B: Create Migration Manually (if shadow DB errors persist)**

```bash
# 1. Create migration directory
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_add_your_feature

# 2. Write migration SQL manually
# Example: prisma/migrations/20260213120000_add_transcript_evaluations/migration.sql
```

```sql
-- CreateTable
CREATE TABLE `your_new_table` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `field1` TEXT NOT NULL,
    `field2` VARCHAR(191) NOT NULL DEFAULT 'value',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `your_new_table_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `your_new_table` ADD CONSTRAINT `your_new_table_userId_fkey` 
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

**Important Notes:**
- Use lowercase table names (e.g., `user`, not `User`) to match MySQL defaults
- Include all indexes defined in schema
- Add foreign key constraints matching Prisma relations

```bash
# 3. Mark migration as applied (since db push already created the table)
npx prisma migrate resolve --applied 20260213120000_add_your_feature
```

---

## 📋 Migration Best Practices

### DO ✅

1. **Always run `npx prisma migrate dev`** for schema changes (not `db push` in production workflows)
2. **Commit migration files** to git alongside schema changes
3. **Use descriptive migration names**: `add_transcript_evaluations`, not `update_schema`
4. **Verify status after migrations**: `npx prisma migrate status`
5. **Check migration history** before marking as applied/rolled back

### DON'T ❌

1. **Don't use `db push` for production-like workflows** (staging, production)
   - `db push` is for prototyping only
   - It bypasses migration history tracking
2. **Don't manually edit applied migrations** (in `prisma/migrations/`)
   - Create new migrations instead
3. **Don't delete migration files** unless you know what you're doing
4. **Don't run `prisma migrate reset`** on staging/production databases
   - This DROPS ALL DATA!

---

## 🔄 Common Workflows

### Starting Fresh (New Developer Setup)

```bash
# 1. Clone repo
git clone <repo>
cd Meaningful-Conversations-Project/meaningful-conversations-backend

# 2. Install dependencies
npm install

# 3. Copy .env and configure DB credentials
cp .env.example .env
# Edit .env: DATABASE_URL, etc.

# 4. Apply all migrations
npx prisma migrate deploy  # For existing migrations
# OR
npx prisma migrate dev     # If you need to create new ones

# 5. Generate Prisma Client
npx prisma generate
```

### Adding a New Feature with DB Changes

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Update prisma/schema.prisma
# Add new models, fields, relations, etc.

# 3. Create migration
npx prisma migrate dev --name add_your_feature

# 4. Test locally
npm start

# 5. Commit everything
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: Add your feature with DB schema changes"
```

### Syncing After Pulling New Migrations

```bash
# After git pull
cd meaningful-conversations-backend

# Apply new migrations from teammates
npx prisma migrate dev

# Regenerate Prisma Client
npx prisma generate
```

---

## 🐛 Common Errors and Solutions

### Error: "Migration X is already applied"

**Solution:**
```bash
# Check what's actually applied
npx prisma migrate status

# If you see duplicate migration names, use:
npx prisma migrate resolve --rolled-back MIGRATION_NAME
# Then try again
```

### Error: "Database is ahead of migrations"

**Cause:** Schema was pushed via `db push` or manual SQL

**Solution:**
1. Create a new migration capturing current state:
   ```bash
   npx prisma migrate dev --name sync_current_state --create-only
   ```
2. Review generated SQL
3. If empty or minimal, apply it:
   ```bash
   npx prisma migrate deploy
   ```

### Error: "Table already exists"

**Cause:** Migration trying to create a table that already exists

**Solution:**
```bash
# Mark the migration as applied (since table exists)
npx prisma migrate resolve --applied MIGRATION_NAME
```

---

## 📚 Additional Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Troubleshooting Guide](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Migration Resolve Command](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)

---

## 🔍 Health Check Commands

### Quick Status Check

```bash
cd meaningful-conversations-backend

# Migration status
npx prisma migrate status

# Database introspection (compare schema to DB)
npx prisma db pull --print

# Validate schema file
npx prisma validate
```

### Detailed Migration History

```bash
# View all applied migrations in database
npx prisma migrate status --schema=./prisma/schema.prisma
```

---

**Created:** 2025-02-13  
**Last Updated:** 2025-02-13  
**Version:** 1.0  
**Tested With:** Prisma 5.x, MySQL 8.0/MariaDB 10.x
