import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import iniciarExecucaoDashboard from './dashboardLifecycle.js';

/**
 * Define um caminho temporário exclusivo para a sessão desta execução e prepara
 * o registro da viagem. Não faz login: a primeira suíte com authFixture o fará.
 */
export default async function globalSetup() {
  process.env.E2E_AUTH_STATE_FILE = path.join(tmpdir(), `travel-auth-${randomUUID()}.json`);
  await iniciarExecucaoDashboard();
}
