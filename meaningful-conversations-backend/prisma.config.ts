import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/** Placeholder for `prisma generate` when DATABASE_URL is unset (CI/Docker build). */
const GENERATE_PLACEHOLDER =
  'mysql://prisma:prisma@127.0.0.1:3306/prisma_generate_placeholder';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || GENERATE_PLACEHOLDER,
  },
});
