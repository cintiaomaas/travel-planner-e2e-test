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

/**
 * Deleta todas as viagens de um usuário específico
 * Útil para limpeza de testes
 * @param {string} email - E-mail do usuário
 */
export async function deleteViagensDoUsuario(email) {
  const connection = await mysql.createConnection(getDatabaseConfig());

  try {
    // Primeiro obtém o ID do usuário
    const [users] = await connection.execute('SELECT id FROM `User` WHERE `email` = ?', [email]);

    if (users.length === 0) {
      return; // Usuário não existe
    }

    const userId = users[0].id;

    // Deleta todas as viagens do usuário
    await connection.execute('DELETE FROM `Trip` WHERE `userId` = ?', [userId]);
  } finally {
    await connection.end();
  }
}

/**
 * Deleta todas as viagens de um usuário específico por ID
 * @param {number} userId - ID do usuário
 */
export async function deleteViagensDoUsuarioPorId(userId) {
  const connection = await mysql.createConnection(getDatabaseConfig());

  try {
    await connection.execute('DELETE FROM `Trip` WHERE `userId` = ?', [userId]);
  } finally {
    await connection.end();
  }
}
