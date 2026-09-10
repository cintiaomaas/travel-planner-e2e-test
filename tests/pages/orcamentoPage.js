import { expect } from '@playwright/test';
import { formatarMoeda } from '../helpers/currencyHelper.js';

export async function abrirOrcamento(page) {
  await page.getByRole('navigation', { name: 'Seções da viagem' })
    .getByRole('button', { name: 'Orçamento', exact: true }).click();
}

export async function validarSaldo(page, saldo, custoTotal) {
  await page.getByRole('navigation', { name: 'Seções da viagem' })
    .getByRole('button', { name: 'Dashboard', exact: true }).click();
  // Conferir o valor principal evita confundir o saldo com o orçamento no rodapé.
  for (const [rotulo, valor] of [['Saldo disponível', saldo], ['Custo total', custoTotal]]) {
    const card = page.getByRole('article').filter({
      has: page.getByText(rotulo, { exact: true }),
    });
    await expect(card.locator('strong')).toHaveText(formatarMoeda(valor));
  }
}

export function linhaDespesa(page, descricao) {
  return page.getByRole('row').filter({
    has: page.getByText(descricao, { exact: true }),
  });
}

export async function cadastrarDespesa(page, descricao, valor) {
  await abrirOrcamento(page);
  await page.getByRole('button', { name: 'Adicionar despesa', exact: true }).click();
  const modal = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Adicionar despesa', exact: true }) });
  await modal.getByLabel('Descrição', { exact: true }).fill(descricao);
  await modal.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('Hospedagem');
  await modal.getByRole('combobox', { name: 'Moeda', exact: true }).selectOption('BRL');
  await modal.getByLabel('Quantidade', { exact: true }).fill('1');
  await modal.getByLabel('Valor unitário', { exact: true }).fill(valor);
  await modal.getByRole('button', { name: 'Salvar despesa', exact: true }).click();
  await expect(modal).not.toBeVisible();
}

export async function editarDespesa(page, descricao, valor) {
  await abrirOrcamento(page);
  await linhaDespesa(page, descricao).getByRole('button', { name: `Editar ${descricao}`, exact: true }).click();
  const modal = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Editar despesa', exact: true }) });
  await modal.getByLabel('Valor unitário', { exact: true }).fill(valor);
  await modal.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(modal).not.toBeVisible();
}

export async function excluirDespesa(page, descricao) {
  await abrirOrcamento(page);
  page.once('dialog', dialog => dialog.accept());
  await linhaDespesa(page, descricao).getByRole('button', { name: `Excluir ${descricao}`, exact: true }).click();
  await expect(linhaDespesa(page, descricao)).toHaveCount(0);
}

export async function alterarESincronizar(page, nomeViagem, total, quantidadeDespesas, acao) {
  // Aguardar a gravação real; o toast sozinho só confirma a alteração local.
  await Promise.all([
    page.waitForResponse(response => {
      if (new URL(response.url()).pathname !== '/api/planner' || response.request().method() !== 'PUT') return false;
      const estado = response.request().postDataJSON();
      const viagem = estado.trips?.find(item => item.name === nomeViagem);
      return response.ok() && viagem?.budget === 5000 && viagem.total === total &&
        estado.expenses.filter(item => item.tripId === viagem.id).length === quantidadeDespesas;
    }, { timeout: 20_000 }),
    acao(),
  ]);
}
