import { test } from '../../fixtures/authFixture.js';
import { criarContextoAutenticado } from '../../helpers/authSession.js';
import { abrirAplicacaoAutenticada } from '../../pages/autenticacaoPage.js';
import {
  prepararViagemDashboard, selecionarViagemDashboard, validarValorCardDashboard,
} from '../../pages/dashboardPage.js';
import { validarSaldo } from '../../pages/orcamentoPage.js';
import {
  prepararDespesas, salvarDespesa, removerDespesa, validarDespesa,
  validarAusenciaDespesa, validarQuantidadeDespesas, validarFormularioInvalido,
} from '../../pages/despesasPage.js';
import {
  viagemDespesas, viagemAssociacao, despesa, segundaDespesa,
  despesaEditada,
} from '../../data/despesas.js';

test.describe('Despesas da viagem', () => {
  test.describe.configure({ mode: 'default', retries: 0 });
  test.setTimeout(90_000);
  let viagem;
  let outraViagem;

  // Assim como no dashboard, o registro sobrevive ao reinício do worker.
  // O globalTeardown remove as duas viagens, mesmo quando um cenário falha.
  test.beforeAll(async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    const { contexto, page } = await criarContextoAutenticado(browser, baseURL);
    try {
      viagem = await prepararViagemDashboard(page, viagemDespesas, 'despesas');
      outraViagem = await prepararViagemDashboard(page, viagemAssociacao, 'despesas-associacao');
    } finally {
      await contexto.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await abrirAplicacaoAutenticada(page);
    await prepararDespesas(page, outraViagem);
    await prepararDespesas(page, viagem);
  });

  test('Deve cadastrar despesa com dados válidos', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await validarDespesa(page, despesa);
    await validarQuantidadeDespesas(page, viagem, 1);
  });

  test('Deve exigir o campo Descrição', async ({ page }) => {
    await validarFormularioInvalido(page, viagem, despesa, 'Descrição', '');
  });

  test('Deve exigir o campo Quantidade', async ({ page }) => {
    await validarFormularioInvalido(page, viagem, despesa, 'Quantidade', '');
  });

  test('Deve exigir o campo Valor unitário', async ({ page }) => {
    await validarFormularioInvalido(page, viagem, despesa, 'Valor unitário', '');
  });

  test('Deve rejeitar valor de despesa 0', async ({ page }) => {
    await validarFormularioInvalido(page, viagem, despesa, 'Valor unitário', '0');
  });

  test('Deve rejeitar valor de despesa -10', async ({ page }) => {
    await validarFormularioInvalido(page, viagem, despesa, 'Valor unitário', '-10');
  });

  test('Deve apresentar os novos dados ao editar uma despesa', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await salvarDespesa(page, viagem, despesaEditada, despesa.descricao);
    await validarDespesa(page, despesaEditada);
    await validarAusenciaDespesa(page, despesa.descricao);
    await validarSaldo(page, 4750, 250);
    await page.reload();
    await selecionarViagemDashboard(page, viagem);
    await validarDespesa(page, despesaEditada);
    await validarAusenciaDespesa(page, despesa.descricao);
  });

  test('Deve excluir uma despesa e atualizar os totais', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await removerDespesa(page, viagem, despesa.descricao);
    await validarAusenciaDespesa(page, despesa.descricao);
    await validarSaldo(page, 5000, 0);
    await page.reload();
    await selecionarViagemDashboard(page, viagem);
    await validarAusenciaDespesa(page, despesa.descricao);
    await validarQuantidadeDespesas(page, viagem, 0);
  });

  test('Deve exibir a despesa cadastrada após atualizar a página', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await page.reload();
    await selecionarViagemDashboard(page, viagem);
    await validarDespesa(page, despesa);
    await validarSaldo(page, 4874.50, 125.50);
  });

  test('Deve atualizar o total de despesas a cada cadastro', async ({ page }) => {
    await validarValorCardDashboard(page, 'Custo total', 0);
    await salvarDespesa(page, viagem, despesa);
    await validarValorCardDashboard(page, 'Custo total', 125.50);
    await salvarDespesa(page, viagem, segundaDespesa);
    await validarValorCardDashboard(page, 'Custo total', 200);
  });

  test('Deve descontar despesas pagas e pendentes do orçamento disponível', async ({ page }) => {
    await validarSaldo(page, 5000, 0);
    await salvarDespesa(page, viagem, despesa);
    await validarSaldo(page, 4874.50, 125.50);
    await salvarDespesa(page, viagem, segundaDespesa);
    await validarSaldo(page, 4800, 200);
  });

  test('Deve cadastrar múltiplas despesas sem sobrescrever os dados', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await salvarDespesa(page, viagem, segundaDespesa);
    await page.reload();
    await selecionarViagemDashboard(page, viagem);
    await validarDespesa(page, despesa);
    await validarDespesa(page, segundaDespesa);
    await validarQuantidadeDespesas(page, viagem, 2);
    await validarSaldo(page, 4800, 200);
  });

  test('Deve associar a despesa somente à viagem correta', async ({ page }) => {
    await salvarDespesa(page, viagem, despesa);
    await selecionarViagemDashboard(page, outraViagem);
    await validarAusenciaDespesa(page, despesa.descricao);
    await validarSaldo(page, 5000, 0);
    await salvarDespesa(page, outraViagem, segundaDespesa);
    await selecionarViagemDashboard(page, viagem);
    await validarDespesa(page, despesa);
    await validarAusenciaDespesa(page, segundaDespesa.descricao);
    await validarSaldo(page, 4874.50, 125.50);
    await selecionarViagemDashboard(page, outraViagem);
    await validarDespesa(page, segundaDespesa);
    await validarSaldo(page, 4925.50, 74.50);
  });
});
