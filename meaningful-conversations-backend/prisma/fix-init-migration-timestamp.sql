-- Fix init migration timestamp in _prisma_migrations table
-- This must be run on all three databases: local, staging, production

UPDATE _prisma_migrations 
SET migration_name = '20251101000000_init'
WHERE migration_name = '20251128000000_init';

-- Verify the change
SELECT migration_name, started_at, finished_at 
FROM _prisma_migrations 
ORDER BY started_at ASC;

