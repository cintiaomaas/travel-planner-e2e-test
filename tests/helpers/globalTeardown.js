import encerrarExecucaoDashboard from './dashboardTeardown.js';
import { removerSessaoAutenticada } from './authSession.js';

/**
 * Executa a limpeza da viagem usando a sessão ainda disponível e, em seguida,
 * remove a autenticação temporária, mesmo quando a limpeza da viagem falha.
 */
export default async function globalTeardown(config) {
  try {
    await encerrarExecucaoDashboard(config);
  } finally {
    await removerSessaoAutenticada();
  }
}
