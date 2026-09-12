import encerrarExecucaoDashboard from './dashboardTeardown.js';
import { removerSessaoAutenticada } from './authSession.js';

/**
 * Executa a limpeza da viagem usando a sessão ainda disponível e, em seguida,
 * remove a autenticação temporária, mesmo quando a limpeza da viagem falha.
 */
export default async function globalTeardown(config) {
  try {
    const erros = [];
    for (const chave of ['dashboard', 'despesas', 'despesas-associacao']) {
      try {
        await encerrarExecucaoDashboard(config, chave);
      } catch (erro) {
        erros.push(erro);
      }
    }
    if (erros.length) throw new AggregateError(erros, 'Falha ao remover viagens da execução.');
  } finally {
    await removerSessaoAutenticada();
  }
}
