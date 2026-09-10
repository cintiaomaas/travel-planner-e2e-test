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
      throw new Error('Limpeza: usuário não encontrado no banco configurado. Confira E2E_DATABASE_URL e o e-mail do login.');
    }

    const userId = users[0].id;

    await connection.beginTransaction();
    try {
      // A interface persiste as viagens neste JSON via /api/planner.
      const [states] = await connection.execute(
        'SELECT `data` FROM `PlannerState` WHERE `userId` = ? FOR UPDATE', [userId],
      );
      let viagensNoEstado = 0;
      if (states.length) {
        const estado = JSON.parse(states[0].data);
        viagensNoEstado = estado.trips.length;
        const estadoLimpo = {
          ...estado,
          trips: [], expenses: [], checklist: [],
          selectedTripId: '', tripInfo: {}, timeline: {},
        };
        await connection.execute(
          'UPDATE `PlannerState` SET `data` = ?, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = ?',
          [JSON.stringify(estadoLimpo), userId],
        );
      }
      const [resultado] = await connection.execute('DELETE FROM `Trip` WHERE `userId` = ?', [userId]);
      await connection.commit();
      console.log(`[Limpeza] Viagens removidas: PlannerState=${viagensNoEstado}, Trip=${resultado.affectedRows}`);
    } catch (erro) {
      await connection.rollback();
      throw erro;
    }
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

/** Remove somente a viagem temporária desta execução, inclusive se o teste falhar. */
export async function deleteViagemDeIntegracao(email, nomeViagem, selecaoAnterior = '') {
  if (!/^(?:E2E )?orçamento [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nomeViagem)) {
    throw new Error('Limpeza recusada: nome sem identificador exclusivo do teste de integração.');
  }
  const connection = await mysql.createConnection(getDatabaseConfig());
  try {
    await connection.beginTransaction();
    const [users] = await connection.execute('SELECT id FROM `User` WHERE email = ?', [email]);
    if (users.length !== 1) throw new Error('Limpeza: confira o usuário e E2E_DATABASE_URL.');
    const userId = users[0].id;
    const [states] = await connection.execute(
      'SELECT `data` FROM `PlannerState` WHERE `userId` = ? FOR UPDATE', [userId],
    );
    let removidas = 0;
    if (states.length) {
      const estado = JSON.parse(states[0].data);
      const ids = new Set(estado.trips.filter(trip => trip.name === nomeViagem).map(trip => trip.id));
      removidas = ids.size;
      if (removidas) {
        const limpo = {
          ...estado,
          trips: estado.trips.filter(trip => !ids.has(trip.id)),
          expenses: estado.expenses.filter(item => !ids.has(item.tripId)),
          checklist: estado.checklist.filter(item => !ids.has(item.tripId)),
          tripInfo: Object.fromEntries(Object.entries(estado.tripInfo).filter(([id]) => !ids.has(id))),
          timeline: Object.fromEntries(Object.entries(estado.timeline).filter(([id]) => !ids.has(id))),
        };
        if (ids.has(estado.selectedTripId)) {
          limpo.selectedTripId = limpo.trips.some(trip => trip.id === selecaoAnterior) ? selecaoAnterior : '';
        }
        await connection.execute(
          'UPDATE `PlannerState` SET `data` = ?, `updatedAt` = CURRENT_TIMESTAMP(3) WHERE `userId` = ?',
          [JSON.stringify(limpo), userId],
        );
        const [verificacao] = await connection.execute('SELECT `data` FROM `PlannerState` WHERE `userId` = ?', [userId]);
        const salvo = JSON.parse(verificacao[0].data);
        if (salvo.trips.some(item => ids.has(item.id)) ||
            salvo.expenses.some(item => ids.has(item.tripId)) ||
            salvo.checklist.some(item => ids.has(item.tripId)) ||
            Object.keys(salvo.tripInfo).some(id => ids.has(id)) ||
            Object.keys(salvo.timeline).some(id => ids.has(id))) {
          throw new Error('Limpeza: restaram dados da viagem temporária.');
        }
      }
    }
    await connection.execute('DELETE FROM `Trip` WHERE `userId` = ? AND `name` = ?', [userId, nomeViagem]);
    await connection.commit();
    console.log(`[Limpeza integração] Viagens temporárias removidas: ${removidas}`);
  } catch (erro) {
    await connection.rollback();
    throw erro;
  } finally {
    await connection.end();
  }
}
