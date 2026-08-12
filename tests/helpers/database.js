import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'node:path';

function getDatabaseConfig() {
  if (!process.env.E2E_DATABASE_URL && !process.env.DATABASE_URL) {
    dotenv.config({
      path: path.resolve(process.cwd(), '../travel-planner/.env'),
      quiet: true,
    });
  }

  const databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'Defina E2E_DATABASE_URL no .env para habilitar a limpeza dos dados de teste.',
    );
  }

  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get('ssl-mode');

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    ssl: sslMode && sslMode !== 'DISABLED'
      ? { rejectUnauthorized: sslMode === 'VERIFY_IDENTITY' }
      : undefined,
  };
}

export async function deleteUserByEmail(email) {
  const connection = await mysql.createConnection(getDatabaseConfig());

  try {
    await connection.execute('DELETE FROM `User` WHERE `email` = ?', [email]);
  } finally {
    await connection.end();
  }
}
