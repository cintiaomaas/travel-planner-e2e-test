import { expect } from '@playwright/test';
import { abrirOrcamento, linhaDespesa, excluirDespesa } from './orcamentoPage.js';
import {
  selecionarViagemDashboard, lerEstadoDashboard, sincronizarDashboard,
  alterarDespesaDashboard, preencherDadosDespesa,
} from './dashboardPage.js';
import { formatarMoeda } from '../helpers/currencyHelper.js';

export async function prepararDespesas(page, viagem) {
  await selecionarViagemDashboard(page, viagem);
  const estado = await lerEstadoDashboard(page);
  for (const item of estado.expenses.filter(item => item.tripId === viagem.id)) {
    await removerDespesa(page, viagem, item.description);
  }
  await abrirOrcamento(page);
}

export async function salvarDespesa(page, viagem, dados, descricaoAnterior) {
  await alterarDespesaDashboard(page, viagem, dados, Boolean(descricaoAnterior), descricaoAnterior);
}

export async function removerDespesa(page, viagem, descricao) {
  await sincronizarDashboard(page, estado => !estado.expenses.some(item =>
    item.tripId === viagem.id && item.description === descricao),
  () => excluirDespesa(page, descricao));
}

export async function validarDespesa(page, dados) {
  await abrirOrcamento(page);
  const linha = linhaDespesa(page, dados.descricao);
  await expect(linha).toHaveCount(1);
  await expect(linha).toContainText(dados.categoria);
  await expect(linha).toContainText(formatarMoeda(dados.valor));
  await linha.getByRole('button', { name: `Editar ${dados.descricao}`, exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByLabel('Descrição', { exact: true })).toHaveValue(dados.descricao);
  await expect(modal.getByRole('combobox', { name: 'Categoria', exact: true })).toHaveValue(dados.categoria);
  await expect(modal.getByRole('switch', { name: 'Status do pagamento', exact: true })).toHaveAttribute('aria-checked', String(dados.pago));
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
}

export async function validarAusenciaDespesa(page, descricao) {
  await abrirOrcamento(page);
  await expect(linhaDespesa(page, descricao)).toHaveCount(0);
}

export async function validarQuantidadeDespesas(page, viagem, quantidade) {
  await abrirOrcamento(page);
  await expect(page.getByRole('row').filter({ has: page.getByRole('button', { name: /^Excluir / }) })).toHaveCount(quantidade);
  const estado = await lerEstadoDashboard(page);
  expect(estado.expenses.filter(item => item.tripId === viagem.id)).toHaveLength(quantidade);
}

export async function validarFormularioInvalido(page, viagem, dados, campo, valor) {
  await page.getByRole('button', { name: 'Adicionar despesa', exact: true }).click();
  // Começar com o valor vazio evita salvar um valor válido anterior quando a máscara rejeita a entrada.
  await preencherDadosDespesa(page, { ...dados, valor: campo === 'Valor unitário' ? '' : dados.valor });
  const modal = page.getByRole('dialog');
  await modal.getByLabel(campo, { exact: true }).fill(valor);
  await modal.getByRole('button', { name: 'Salvar despesa', exact: true }).click();
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel(campo).and(modal.locator('input:invalid, input[aria-invalid="true"]'))).toHaveCount(1);
  await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.reload();
  await selecionarViagemDashboard(page, viagem);
  await validarAusenciaDespesa(page, dados.descricao);
  const estado = await lerEstadoDashboard(page);
  expect(estado.expenses.filter(item => item.tripId === viagem.id)).toHaveLength(0);
}
