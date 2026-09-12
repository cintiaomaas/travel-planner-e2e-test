import { expect } from '@playwright/test';
import { abrirOrcamento, linhaDespesa, excluirDespesa } from './orcamentoPage.js';
import { formatarMoeda } from '../helpers/currencyHelper.js';
import { viagemDashboard, despesasDashboard } from '../data/dashboard.js';
import { preencherESubmeterViagem, validarViagemCriada } from './viagemPage.js';
import { abrirChecklist, alterarStatus } from './checklistPage.js';
import { lerViagemDaExecucao, registrarViagemDaExecucao } from '../helpers/dashboardLifecycle.js';

export async function abrirDashboard(page) {
  await page.getByRole('navigation', { name: 'Seções da viagem' })
    .getByRole('button', { name: 'Dashboard', exact: true }).click();
}

export function cardDashboard(page, titulo) {
  return page.getByRole('article').filter({ has: page.getByText(titulo, { exact: true }) });
}

export async function validarValoresDashboard(page, total, pago, saldo) {
  await abrirDashboard(page);
  for (const [titulo, valor] of [['Custo total', total], ['Já pago', pago], ['A pagar', total - pago], ['Saldo disponível', saldo]]) {
    await expect.soft(cardDashboard(page, titulo).locator('strong')).toHaveText(
      valor === null ? 'Não definido' : formatarMoeda(valor),
    );
  }
}

export async function sincronizarDashboard(page, verificar, acao) {
  const [resposta] = await Promise.all([
    page.waitForResponse(response => {
      if (new URL(response.url()).pathname !== '/api/planner' || response.request().method() !== 'PUT') return false;
      return verificar(response.request().postDataJSON());
    }, { timeout: 20_000 }),
    acao(),
  ]);
  expect(resposta.ok(), 'A alteração da viagem deve ser persistida').toBeTruthy();
  return resposta.request().postDataJSON();
}

export async function salvarDespesaDashboard(page, despesa, editar = false, descricaoAnterior = despesa.descricao) {
  await abrirOrcamento(page);
  if (editar) {
    await linhaDespesa(page, descricaoAnterior).getByRole('button', { name: `Editar ${descricaoAnterior}`, exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'Adicionar despesa', exact: true }).click();
  }
  await preencherDadosDespesa(page, despesa);
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: editar ? 'Salvar alterações' : 'Salvar despesa', exact: true }).click();
  await expect(modal).not.toBeVisible();
}

export async function preencherDadosDespesa(page, despesa) {
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Descrição', { exact: true }).fill(despesa.descricao);
  await modal.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption(despesa.categoria);
  await modal.getByRole('combobox', { name: 'Moeda', exact: true }).selectOption('BRL');
  await modal.getByLabel('Quantidade', { exact: true }).fill('1');
  await modal.getByLabel('Valor unitário', { exact: true }).fill(String(despesa.valor));
  const pago = modal.getByRole('switch', { name: 'Status do pagamento', exact: true });
  if ((await pago.getAttribute('aria-checked')) !== String(despesa.pago)) await pago.click();
}

export async function editarOrcamentoDashboard(page, valor, peloCard = false) {
  await abrirDashboard(page);
  await page.getByRole('button', { name: peloCard ? 'Definir orçamento' : 'Editar viagem', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.locator('input[name="budget"]').fill(valor);
  await modal.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(modal).not.toBeVisible();
}

// Conferir o tooltip de cada fatia valida os dados do gráfico renderizado.
export async function validarGraficoDashboard(page, nome, valores) {
  const grafico = page.getByLabel(nome, { exact: true });
  await expect(grafico).toBeVisible();
  await expect(grafico.locator('.recharts-pie-sector')).toHaveCount(valores.length);
  for (let indice = 0; indice < valores.length; indice++) {
    const [categoria, valor] = valores[indice];
    await expect(grafico.locator('.chart-legend-label').filter({ hasText: new RegExp(`^${categoria}$`) })).toBeVisible();
    // Eventos do SVG evitam que o centro sobreposto do donut intercepte o mouse.
    await grafico.locator('.recharts-pie-sector').nth(indice).dispatchEvent('mouseover');
    const tooltip = grafico.locator('.recharts-tooltip-wrapper');
    await expect.soft(tooltip).toBeVisible();
    await expect.soft(tooltip).toContainText(categoria);
    await expect.soft(tooltip).toContainText(formatarMoeda(valor));
    await grafico.locator('.recharts-pie-sector').nth(indice).dispatchEvent('mouseout');
  }
}

export async function lerEstadoDashboard(page) {
  const resposta = await page.request.get('/api/planner');
  expect(resposta.ok()).toBeTruthy();
  return (await resposta.json()).data;
}

export async function prepararViagemDashboard(page, dadosViagem = viagemDashboard, chave = 'dashboard') {
  const registro = await lerViagemDaExecucao(chave);
  const estado = await lerEstadoDashboard(page);
  if (registro) {
    expect(estado.trips.some(item => item.id === registro.id), 'A viagem compartilhada deve continuar disponível').toBe(true);
    return registro;
  }
  expect(estado.trips.filter(item => item.name === dadosViagem.nome),
    `Já existe uma viagem ${dadosViagem.nome}. A suíte não altera viagens preexistentes.`).toHaveLength(0);
  await page.getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name: /^Minhas viagens(?: \d+)?$/ }).click();
  // A listagem vazia repete a mesma ação no cabeçalho e no estado vazio.
  await page.getByRole('button', { name: 'Nova viagem', exact: true }).first().click();
  let gravacao;
  const registrarCriacao = request => {
    if (new URL(request.url()).pathname !== '/api/planner' || request.method() !== 'PUT') return;
    const criada = request.postDataJSON().trips?.find(item => item.name === dadosViagem.nome);
    if (criada && !gravacao) gravacao = registrarViagemDaExecucao({ id: criada.id, nome: criada.name }, chave);
  };
  page.on('request', registrarCriacao);
  try {
    const salvo = await sincronizarDashboard(page, dados => dados.trips.some(item => item.name === dadosViagem.nome),
      () => preencherESubmeterViagem(page, dadosViagem));
    await validarViagemCriada(page, dadosViagem.nome);
    const criada = salvo.trips.find(item => item.name === dadosViagem.nome);
    return { id: criada.id, nome: criada.name };
  } finally {
    page.off('request', registrarCriacao);
    if (gravacao) await gravacao;
  }
}

export async function selecionarViagemDashboard(page, viagem) {
  await page.getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name: /^Minhas viagens(?: \d+)?$/ }).click();
  await page.getByPlaceholder('Buscar por cidade ou país').fill(viagem.nome);
  await page.getByRole('button', { name: `Abrir ${viagem.nome}`, exact: true }).click();
  await validarViagemCriada(page, viagem.nome);
}

export async function prepararEstadoDashboard(page, viagem) {
  await selecionarViagemDashboard(page, viagem);
  const estado = await lerEstadoDashboard(page);
  if (estado.trips.find(item => item.id === viagem.id).budget !== 5000) {
    await alterarOrcamentoDashboard(page, viagem, '5000');
  }
  for (const dados of despesasDashboard) {
    const existente = estado.expenses.find(item => item.tripId === viagem.id && item.description === dados.descricao);
    if (!existente || existente.convertedAmount !== dados.valor || existente.category !== dados.categoria || existente.paid !== dados.pago) {
      await alterarDespesaDashboard(page, viagem, dados, Boolean(existente));
    }
  }
  await definirConclusoesDashboard(page, viagem, 0);
  await abrirDashboard(page);
}

export async function alterarDespesaDashboard(page, viagem, dados, editar = true, descricaoAnterior = dados.descricao) {
  await sincronizarDashboard(page, estado => estado.expenses.some(item =>
    item.tripId === viagem.id && item.description === dados.descricao &&
    item.convertedAmount === dados.valor && item.category === dados.categoria && item.paid === dados.pago),
  () => salvarDespesaDashboard(page, dados, editar, descricaoAnterior));
}

export async function alterarOrcamentoDashboard(page, viagem, valor, peloCard = false) {
  await sincronizarDashboard(page, estado => estado.trips.find(item => item.id === viagem.id)?.budget === (Number(valor) || 0),
    () => editarOrcamentoDashboard(page, valor, peloCard));
}

export async function removerDespesasDashboard(page, viagem) {
  for (const dados of despesasDashboard) {
    await sincronizarDashboard(page, estado => !estado.expenses.some(item => item.tripId === viagem.id && item.description === dados.descricao),
      () => excluirDespesa(page, dados.descricao));
  }
}

export async function definirConclusoesDashboard(page, viagem, quantidade) {
  const estado = await lerEstadoDashboard(page);
  const itens = estado.checklist.filter(grupo => grupo.tripId === viagem.id).flatMap(grupo => grupo.items);
  expect(itens).toHaveLength(12);
  await abrirChecklist(page);
  for (const [indice, item] of itens.entries()) {
    const concluido = indice < quantidade;
    if (item.done !== concluido) await alterarStatus(page, viagem.nome, item.label, concluido);
  }
}

export async function validarValorCardDashboard(page, titulo, valor) {
  await abrirDashboard(page);
  await expect(cardDashboard(page, titulo).locator('strong')).toHaveText(valor === null ? 'Não definido' : formatarMoeda(valor));
}

export async function validarUsoLimiteDashboard(page, percentual) {
  await expect(cardDashboard(page, 'Uso do limite').locator('.budget-ring strong')).toHaveText(`${percentual}%`);
  await expect(cardDashboard(page, 'Custo total')).toContainText(`${percentual}% do orçamento`);
}

export async function validarOrcamentoNaoDefinidoDashboard(page) {
  const limite = cardDashboard(page, 'Uso do limite');
  await expect(limite).toContainText('orçamento não definido');
  await expect(limite.locator('.budget-ring strong')).toHaveText('—');
  await expect(limite.getByRole('button', { name: 'Definir orçamento' })).toBeEnabled();
}

export async function validarPercentualPagoDashboard(page, percentual) {
  await expect(page.locator('.donut-center span')).toHaveText(`${percentual}%`);
  await expect(cardDashboard(page, 'Já pago')).toContainText(`${percentual}% do total`);
}

export async function validarPercentualChecklistDashboard(page, concluidos, total) {
  await abrirDashboard(page);
  const card = cardDashboard(page, 'Checklist');
  const percentual = Math.round(concluidos / total * 100);
  await expect(card.locator('.checklist-big-number strong')).toHaveText(`${percentual}%`);
  await expect(card).toContainText(`${concluidos} de ${total} tarefas prontas`);
  await expect(card.locator('.card-progress i')).toHaveAttribute('style', `width: ${percentual}%;`);
}

export async function excluirViagemDashboard(page, viagem) {
  const estado = await lerEstadoDashboard(page);
  if (!estado.trips.some(item => item.id === viagem.id)) return;
  expect(estado.trips.filter(item => item.name === viagem.nome).map(item => item.id)).toEqual([viagem.id]);
  await page.getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name: /^Minhas viagens(?: \d+)?$/ }).click();
  await page.getByPlaceholder('Buscar por cidade ou país').fill(viagem.nome);
  page.once('dialog', dialog => dialog.accept());
  await sincronizarDashboard(page, dados => !dados.trips.some(item => item.id === viagem.id) &&
    !dados.expenses.some(item => item.tripId === viagem.id) && !dados.checklist.some(item => item.tripId === viagem.id),
  () => page.getByRole('button', { name: `Excluir ${viagem.nome}`, exact: true }).click());
  await expect(page.getByRole('heading', { name: viagem.nome, exact: true })).toHaveCount(0);
  const salvo = await lerEstadoDashboard(page);
  expect(salvo.trips.some(item => item.id === viagem.id)).toBe(false);
  expect(salvo.expenses.some(item => item.tripId === viagem.id)).toBe(false);
  expect(salvo.checklist.some(item => item.tripId === viagem.id)).toBe(false);
}
