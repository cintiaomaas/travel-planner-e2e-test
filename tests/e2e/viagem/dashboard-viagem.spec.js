import { criarContextoAutenticado } from '../../helpers/authSession.js';
import { abrirAplicacaoAutenticada } from '../../pages/autenticacaoPage.js';
import { test } from '../../fixtures/authFixture.js';
import { despesasDashboard } from '../../data/dashboard.js';
import {
  prepararViagemDashboard, prepararEstadoDashboard, alterarDespesaDashboard,
  alterarOrcamentoDashboard, definirConclusoesDashboard, removerDespesasDashboard,
  validarValorCardDashboard, validarValoresDashboard, validarUsoLimiteDashboard,
  validarOrcamentoNaoDefinidoDashboard, validarPercentualPagoDashboard,
  validarPercentualChecklistDashboard,
  validarGraficoDashboard, abrirDashboard,
} from '../../pages/dashboardPage.js';

test.describe.only('Dashboard da viagem', () => {
  test.describe.configure({ mode: 'default', retries: 0 });
  test.setTimeout(90_000);
  let viagem;

  // O ID é reutilizado se o worker reiniciar. A exclusão ocorre no globalTeardown,
  // pois afterAll também seria executado antes dos testes restantes após uma falha.
  test.beforeAll(async ({ browser, baseURL }) => {
    const { contexto, page } = await criarContextoAutenticado(browser, baseURL);
    try {
      viagem = await prepararViagemDashboard(page);
    } finally {
      await contexto.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(10_000);
    await abrirAplicacaoAutenticada(page);
    await prepararEstadoDashboard(page, viagem);
  });

  test('Deve apresentar valores zerados quando não existem despesas', async ({ page }) => {
    await removerDespesasDashboard(page, viagem);
    await validarValoresDashboard(page, 0, 0, 5000);
    await validarUsoLimiteDashboard(page, 0);
    await validarPercentualPagoDashboard(page, 0);
  });

  test('Deve atualizar o custo total ao editar uma despesa', async ({ page }) => {
    await validarValorCardDashboard(page, 'Custo total', 2000);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], valor: 3000 });
    await validarValorCardDashboard(page, 'Custo total', 4000);
  });

  test('Deve somar em Já pago somente despesas marcadas como pagas', async ({ page }) => {
    await validarValorCardDashboard(page, 'Já pago', 1000);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[1], pago: true });
    await validarValorCardDashboard(page, 'Já pago', 1500);
  });

  test('Deve somar em A pagar as despesas desmarcadas como pagas', async ({ page }) => {
    await validarValorCardDashboard(page, 'A pagar', 1000);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], pago: false });
    await validarValorCardDashboard(page, 'A pagar', 2000);
  });

  test('Deve diminuir o saldo disponível conforme o custo aumenta', async ({ page }) => {
    await validarValorCardDashboard(page, 'Saldo disponível', 3000);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], valor: 3000 });
    await validarValorCardDashboard(page, 'Saldo disponível', 1000);
  });

  test('Deve agrupar no gráfico os valores das despesas por categoria', async ({ page }) => {
    await validarGraficoDashboard(page, 'Gráfico de gastos por categoria', [['Hospedagem', 1000], ['Alimentação', 1000]]);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[1], categoria: 'Transporte' });
    await abrirDashboard(page);
    await validarGraficoDashboard(page, 'Gráfico de gastos por categoria', [['Hospedagem', 1000], ['Transporte', 500], ['Alimentação', 500]]);
  });

  test('Deve atualizar os valores e o percentual pago no gráfico de pagamentos', async ({ page }) => {
    await validarGraficoDashboard(page, 'Gráfico de valores pagos e pendentes', [['Pago', 1000], ['Pendente', 1000]]);
    await validarPercentualPagoDashboard(page, 50);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], valor: 3000, pago: false });
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[1], pago: true });
    await abrirDashboard(page);
    await validarGraficoDashboard(page, 'Gráfico de valores pagos e pendentes', [['Pago', 500], ['Pendente', 3500]]);
    await validarPercentualPagoDashboard(page, 13);
  });

  test('Deve apresentar 13% pago no gráfico de pagamentos', async ({ page }) => {
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], valor: 3000, pago: false });
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[1], pago: true });
    await abrirDashboard(page);
    await validarPercentualPagoDashboard(page, 13);
  });

  test('Deve apresentar o percentual de uso do orçamento informado', async ({ page }) => {
    await validarUsoLimiteDashboard(page, 40);
    await alterarDespesaDashboard(page, viagem, { ...despesasDashboard[0], valor: 3000 });
    await abrirDashboard(page);
    await validarUsoLimiteDashboard(page, 80);
  });

  test('Deve calcular saldo e percentual quando o limite é atingido', async ({ page }) => {
    await alterarOrcamentoDashboard(page, viagem, '2000');
    await validarValorCardDashboard(page, 'Saldo disponível', 0);
    await validarUsoLimiteDashboard(page, 100);
  });

  test('Deve calcular saldo negativo e percentual acima de 100% ao ultrapassar o limite', async ({ page }) => {
    await alterarOrcamentoDashboard(page, viagem, '1000');
    await validarValorCardDashboard(page, 'Saldo disponível', -1000);
    await validarUsoLimiteDashboard(page, 200);
  });

  test('Deve mostrar orçamento não definido e permitir defini-lo pelo card', async ({ page }) => {
    await alterarOrcamentoDashboard(page, viagem, '');
    await validarValoresDashboard(page, 2000, 1000, null);
    await validarOrcamentoNaoDefinidoDashboard(page);
    await alterarOrcamentoDashboard(page, viagem, '5000', true);
    await validarValorCardDashboard(page, 'Saldo disponível', 3000);
    await validarUsoLimiteDashboard(page, 40);
  });

  test('Deve apresentar checklist em 0% quando nada foi concluído', async ({ page }) => {
    await validarPercentualChecklistDashboard(page, 0, 12);
  });

  test('Deve apresentar o percentual parcial do checklist', async ({ page }) => {
    await definirConclusoesDashboard(page, viagem, 1);
    await validarPercentualChecklistDashboard(page, 1, 12);
    await definirConclusoesDashboard(page, viagem, 6);
    await validarPercentualChecklistDashboard(page, 6, 12);
  });

  test('Deve apresentar checklist em 100% quando todos os itens estão concluídos', async ({ page }) => {
    await definirConclusoesDashboard(page, viagem, 12);
    await validarPercentualChecklistDashboard(page, 12, 12);
  });

  test('Deve reduzir o percentual do checklist ao desmarcar um item', async ({ page }) => {
    await definirConclusoesDashboard(page, viagem, 12);
    await definirConclusoesDashboard(page, viagem, 11);
    await validarPercentualChecklistDashboard(page, 11, 12);
  });
});
