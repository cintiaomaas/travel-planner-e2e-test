import { test as base } from '@playwright/test';
import { lerSessaoAutenticada, criarContextoAutenticado } from '../helpers/authSession.js';

/**
 * Exponha os testes de uma suíte autenticada importando test deste arquivo.
 * Usa loginUsuarioExistente e compartilha a sessão, não os dados dos testes.
 * Testes de login/cadastro devem importar test diretamente de @playwright/test.
 */
export const test = base.extend({
  // Prepara a autenticação uma vez por worker. Reaproveita o arquivo da execução
  // se outro worker já salvou a sessão, inclusive após reinício por falha.
  sessaoAutenticada: [async ({ browser }, use, workerInfo) => {
    let sessao = await lerSessaoAutenticada();
    if (!sessao) {
      const { contexto } = await criarContextoAutenticado(browser, workerInfo.project.use.baseURL);
      try {
        sessao = await lerSessaoAutenticada();
      } finally {
        await contexto.close();
      }
    }
    // Entrega a sessão às fixtures que dependem dela.
    await use(sessao);
  }, { scope: 'worker' }],

  // Inicializa cada contexto com os cookies e o localStorage salvos.
  // Cada teste mantém sua própria página e contexto, sem repetir o login.
  storageState: async ({ sessaoAutenticada }, use) => {
    await use(sessaoAutenticada);
  },
});

export { expect } from '@playwright/test';
