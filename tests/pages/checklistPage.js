import { expect } from '@playwright/test';
import { preencherLogin } from './autenticacaoPage.js';
import { preencherESubmeterViagem, validarViagemCriada } from './viagemPage.js';

export const contemItem = (label, done = false) => itens => itens.some(item => item.label === label && item.done === done);

export async function entrarParaChecklist(page, usuario) {
  await preencherLogin(page, usuario.email, usuario.password);
  const [resposta] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/planner' && response.request().method() === 'GET'),
    page.getByRole('button', { name: 'Entrar', exact: true }).click(),
  ]);
  expect(resposta.ok()).toBeTruthy();
  await expect(page).toHaveURL(/.*\/$/);
}

export async function prepararViagemChecklist(page, dados) {
  await page.getByRole('button', { name: 'Nova viagem', exact: true }).click();
  await sincronizarChecklist(page, dados.nome, itens => itens.length > 0,
    () => preencherESubmeterViagem(page, dados));
  await validarViagemCriada(page, dados.nome);
  await abrirChecklist(page);
}

export async function adicionar(page, nome, label, grupo = 'Documentos') {
  await sincronizarChecklist(page, nome, contemItem(label), () => adicionarItemChecklist(page, label, grupo));
}

export async function alterarStatus(page, nome, label, concluido) {
  await sincronizarChecklist(page, nome, contemItem(label, concluido), () =>
    itemChecklist(page, label).getByRole('button', {
      name: `${concluido ? 'Marcar' : 'Desmarcar'} ${label}`, exact: true,
    }).click());
}

export async function validarChecklistBasico(page, gruposEsperados) {
  const total = gruposEsperados.reduce((soma, grupo) => soma + grupo.itens.length, 0);
  await expect(page.locator('.checklist-group')).toHaveCount(gruposEsperados.length);
  await expect(page.locator('.checklist-item')).toHaveCount(total);
  for (const grupo of gruposEsperados) {
    await expect(grupoChecklist(page, grupo.nome).locator('.check-label')).toHaveText(grupo.itens);
    for (const descricao of grupo.itens) await validarItemChecklist(page, descricao, false);
  }
  await expect(page.getByRole('heading', { name: `0 de ${total} tarefas concluídas`, exact: true })).toBeVisible();
  await expect(page.locator('.checklist-progress-ring')).toHaveText('0%');
}

export async function abrirChecklist(page) {
  await page.getByRole('navigation', { name: 'Seções da viagem' })
    .getByRole('button', { name: /^Checklist(?: \d+\/\d+)?$/ }).click();
  await expect(page.getByRole('heading', { name: 'Checklist da viagem', exact: true })).toBeVisible();
}

export function grupoChecklist(page, grupo = 'Documentos') {
  return page.getByRole('article').filter({
    has: page.getByRole('heading', { name: grupo, exact: true }),
  });
}

export function itemChecklist(page, descricao) {
  return page.locator('.checklist-item').filter({
    has: page.getByRole('button', { name: descricao, exact: true }),
  });
}

export async function validarItemChecklist(page, descricao, concluido = false) {
  const item = itemChecklist(page, descricao);
  await expect(item).toHaveCount(1);
  await expect(item).toBeVisible();
  await expect(item.getByRole('button', {
    name: `${concluido ? 'Desmarcar' : 'Marcar'} ${descricao}`, exact: true,
  })).toBeVisible();
  if (concluido) await expect(item).toHaveClass(/\bdone\b/);
  else await expect(item).not.toHaveClass(/\bdone\b/);
}

export async function adicionarItemChecklist(page, descricao, grupo = 'Documentos') {
  await grupoChecklist(page, grupo).getByRole('button', { name: 'Adicionar item', exact: true }).click();
  await page.getByPlaceholder('Nome da nova tarefa', { exact: true }).fill(descricao);
  await page.getByRole('button', { name: 'Salvar item', exact: true }).click();
  await expect(page.getByPlaceholder('Nome da nova tarefa', { exact: true })).not.toBeVisible();
}

export async function editarItemChecklist(page, descricao, novaDescricao) {
  await itemChecklist(page, descricao).getByRole('button', { name: `Editar ${descricao}`, exact: true }).click();
  await page.locator('.checklist-edit-form').getByRole('textbox').fill(novaDescricao);
  await page.getByRole('button', { name: 'Salvar alteração', exact: true }).click();
}

export async function excluirItemChecklist(page, descricao) {
  page.once('dialog', dialog => dialog.accept());
  await itemChecklist(page, descricao).getByRole('button', { name: `Excluir ${descricao}`, exact: true }).click();
}

export async function sincronizarChecklist(page, nomeViagem, verificar, acao) {
  // A resposta deve corresponder à viagem e à alteração esperada, não a um PUT anterior.
  const [resposta] = await Promise.all([
    page.waitForResponse(response => {
      if (new URL(response.url()).pathname !== '/api/planner' || response.request().method() !== 'PUT') return false;
      const estado = response.request().postDataJSON();
      const viagem = estado.trips?.find(item => item.name === nomeViagem);
      if (!viagem) return false;
      const grupos = estado.checklist.filter(grupo => grupo.tripId === viagem.id);
      return verificar(grupos.flatMap(grupo => grupo.items), grupos);
    }, { timeout: 20_000 }),
    acao(),
  ]);
  expect(resposta.ok(), 'A alteração do checklist deve ser salva no servidor').toBeTruthy();
}

export async function selecionarViagemChecklist(page, nome) {
  await page.getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name: /^Minhas viagens(?: \d+)?$/ }).click();
  await page.getByPlaceholder('Buscar por cidade ou país').fill(nome);
  await page.getByRole('button', { name: `Abrir ${nome}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: nome, exact: true })).toBeVisible();
  await abrirChecklist(page);
}

export async function recarregarChecklist(page, nome) {
  const [resposta] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/planner' && response.request().method() === 'GET'),
    page.reload(),
  ]);
  expect(resposta.ok(), 'Recarregar os dados persistidos').toBeTruthy();
  await selecionarViagemChecklist(page, nome);
}
