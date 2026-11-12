'use strict';

const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

/**
 * Build Prisma MariaDB adapter config from a standard DATABASE_URL (mysql://…).
 * Supports `?socket=` for local Cloud-style URLs (see server.js).
 */
function mariadbConfigFromDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for Prisma');
  }

  const parsed = new URL(databaseUrl);
  const socket = parsed.searchParams.get('socket');

  if (socket) {
    return {
      socketPath: socket,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
      connectionLimit: 10,
      connectTimeout: 5000,
    };
  }

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
    connectionLimit: 10,
    connectTimeout: 5000,
  };
}

function createMariaDbAdapter(databaseUrl) {
  return new PrismaMariaDb(mariadbConfigFromDatabaseUrl(databaseUrl));
}

module.exports = {
  mariadbConfigFromDatabaseUrl,
  createMariaDbAdapter,
};
