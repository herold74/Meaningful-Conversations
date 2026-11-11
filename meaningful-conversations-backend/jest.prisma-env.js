'use strict';

// Prisma 7 adapter wiring requires a parsable DATABASE_URL when modules load.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://jest:jest@127.0.0.1:3306/jest';
}
