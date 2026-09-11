import { test, expect } from '@playwright/test';


import { loginUsuarioExistente } from '../../data/usuarios.js';
import { criarViagemChecklist, criarItensChecklist, checklistBasicoInternacional } from '../../data/checklist.js';
import { deleteViagensDoUsuario } from '../../helpers/database.js';
import {
  adicionar, alterarStatus, contemItem, prepararViagemChecklist, entrarParaChecklist, validarChecklistBasico, editarItemChecklist, excluirItemChecklist,
  grupoChecklist, itemChecklist, validarItemChecklist, sincronizarChecklist,
  recarregarChecklist, selecionarViagemChecklist,
} from '../../pages/checklistPage.js';

test.describe('Gerenciamento do checklist da viagem', () => {
  test.setTimeout(90_000);
  test.describe.configure({ mode: 'default' });
  let viagemChecklist;
  let itensChecklist;
  let descricao;

  test.beforeAll(async ({ browser, baseURL }) => {
    viagemChecklist = criarViagemChecklist();
    const contexto = await browser.newContext({ baseURL });
    try {
      const pagina = await contexto.newPage();
      await entrarParaChecklist(pagina, loginUsuarioExistente);
      await prepararViagemChecklist(pagina, viagemChecklist);
    } finally {
      await contexto.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    itensChecklist = criarItensChecklist();
    descricao = itensChecklist[0].descricao;
    await entrarParaChecklist(page, loginUsuarioExistente);
    await selecionarViagemChecklist(page, viagemChecklist.nome);
  });

  test.afterAll(async () => {
    // Os contextos individuais são encerrados pelo Playwright antes deste hook.
    await deleteViagensDoUsuario(loginUsuarioExistente.email);
  });

  test('Deve criar automaticamente o checklist básico de uma nova viagem internacional', async ({ page }) => {
    const viagemNova = criarViagemChecklist();
    await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
    await prepararViagemChecklist(page, viagemNova);
    await validarChecklistBasico(page, checklistBasicoInternacional);
    await recarregarChecklist(page, viagemNova.nome);
    await validarChecklistBasico(page, checklistBasicoInternacional);
  });

  test('Deve adicionar novo item ao checklist', async ({ page }) => {
    await adicionar(page, viagemChecklist.nome, descricao);
    await validarItemChecklist(page, descricao);
    await recarregarChecklist(page, viagemChecklist.nome);
    await validarItemChecklist(page, descricao);
  });

  test('Não deve criar item sem preencher o campo obrigatório', async ({ page }) => {
    const itensAntes = await page.locator('.checklist-item .check-label').allTextContents();
    await page.getByRole('button', { name: 'Novo item', exact: true }).click();
    const campo = page.getByPlaceholder('Nome da nova tarefa', { exact: true });
    for (const valor of ['', '   ']) {
      await campo.fill(valor);
      await page.getByRole('button', { name: 'Salvar item', exact: true }).click();
      await expect(campo).toBeVisible();
      await expect(campo).toHaveValue(valor);
      await expect(page.locator('.checklist-item .check-label')).toHaveText(itensAntes);
    }
    await recarregarChecklist(page, viagemChecklist.nome);
    await expect(page.locator('.checklist-item .check-label')).toHaveText(itensAntes);
  });

  test('Deve marcar item como concluído', async ({ page }) => {
    await adicionar(page, viagemChecklist.nome, descricao);
    await alterarStatus(page, viagemChecklist.nome, descricao, true);
    await validarItemChecklist(page, descricao, true);
    await recarregarChecklist(page, viagemChecklist.nome);
    await validarItemChecklist(page, descricao, true);
  });

  test('Deve desmarcar item concluído', async ({ page }) => {
    await adicionar(page, viagemChecklist.nome, descricao);
    await alterarStatus(page, viagemChecklist.nome, descricao, true);
    await validarItemChecklist(page, descricao, true);
    await alterarStatus(page, viagemChecklist.nome, descricao, false);
    await validarItemChecklist(page, descricao);
    await recarregarChecklist(page, viagemChecklist.nome);
    await validarItemChecklist(page, descricao);
  });

  test('Deve editar item do checklist e persistir a alteração', async ({ page }) => {
    const novaDescricao = `${descricao} atualizado`;
    await adicionar(page, viagemChecklist.nome, descricao);
    await alterarStatus(page, viagemChecklist.nome, descricao, true);
    await sincronizarChecklist(page, viagemChecklist.nome,
      itens => contemItem(novaDescricao, true)(itens) && !itens.some(item => item.label === descricao),
      () => editarItemChecklist(page, descricao, novaDescricao));
    await expect(itemChecklist(page, descricao)).toHaveCount(0);
    await validarItemChecklist(page, novaDescricao, true);
    await recarregarChecklist(page, viagemChecklist.nome);
    await expect(itemChecklist(page, descricao)).toHaveCount(0);
    await validarItemChecklist(page, novaDescricao, true);
  });

  test('Deve excluir item do checklist sem mantê-lo na listagem', async ({ page }) => {
    const preservado = itensChecklist[1].descricao;
    await adicionar(page, viagemChecklist.nome, descricao);
    await adicionar(page, viagemChecklist.nome, preservado);
    await sincronizarChecklist(page, viagemChecklist.nome,
      itens => !itens.some(item => item.label === descricao) && contemItem(preservado)(itens),
      () => excluirItemChecklist(page, descricao));
    await expect(itemChecklist(page, descricao)).toHaveCount(0);
    await validarItemChecklist(page, preservado);
    await recarregarChecklist(page, viagemChecklist.nome);
    await expect(itemChecklist(page, descricao)).toHaveCount(0);
    await validarItemChecklist(page, preservado);
  });

  test('Deve adicionar múltiplos itens ao checklist', async ({ page }) => {
    const quantidadeInicial = await page.locator('.checklist-item').count();
    for (const item of itensChecklist) {
      await adicionar(page, viagemChecklist.nome, item.descricao, item.grupo);
      await validarItemChecklist(page, item.descricao);
    }
    await expect(page.locator('.checklist-item')).toHaveCount(quantidadeInicial + itensChecklist.length);
    await recarregarChecklist(page, viagemChecklist.nome);
    await expect(page.locator('.checklist-item')).toHaveCount(quantidadeInicial + itensChecklist.length);
    for (const item of itensChecklist) await validarItemChecklist(page, item.descricao);
  });

  test('Deve exibir os itens cadastrados nos respectivos grupos', async ({ page }) => {
    for (const item of itensChecklist) await adicionar(page, viagemChecklist.nome, item.descricao, item.grupo);
    await recarregarChecklist(page, viagemChecklist.nome);
    for (const item of itensChecklist) {
      await validarItemChecklist(page, item.descricao);
      await expect(grupoChecklist(page, item.grupo).getByRole('button', {
        name: item.descricao, exact: true,
      })).toBeVisible();
    }
  });

  test('Deve persistir os estados concluído, pendente e desmarcado após atualizar a página', async ({ page }) => {
    const [concluido, pendente, desmarcado] = itensChecklist.map(item => item.descricao);
    for (const item of itensChecklist) await adicionar(page, viagemChecklist.nome, item.descricao, item.grupo);
    await alterarStatus(page, viagemChecklist.nome, concluido, true);
    await alterarStatus(page, viagemChecklist.nome, desmarcado, true);
    await alterarStatus(page, viagemChecklist.nome, desmarcado, false);
    await recarregarChecklist(page, viagemChecklist.nome);
    await validarItemChecklist(page, concluido, true);
    await validarItemChecklist(page, pendente);
    await validarItemChecklist(page, desmarcado);
  });

  test('Deve apresentar apenas os itens associados à viagem selecionada', async ({ page }) => {
    const exclusivoA = 'Documento exclusivo da viagem A';
    const exclusivoB = 'Documento exclusivo da viagem B';
    await adicionar(page, viagemChecklist.nome, exclusivoA);
    await adicionar(page, viagemChecklist.nome, descricao);
    await alterarStatus(page, viagemChecklist.nome, descricao, true);
    await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
    const outraViagem = criarViagemChecklist();
    await prepararViagemChecklist(page, outraViagem);
    await expect(itemChecklist(page, exclusivoA)).toHaveCount(0);
    await adicionar(page, outraViagem.nome, exclusivoB);
    await adicionar(page, outraViagem.nome, descricao);
    await recarregarChecklist(page, outraViagem.nome);
    await validarItemChecklist(page, exclusivoB);
    await validarItemChecklist(page, descricao);
    await expect(itemChecklist(page, exclusivoA)).toHaveCount(0);
    await selecionarViagemChecklist(page, viagemChecklist.nome);
    await validarItemChecklist(page, exclusivoA);
    await validarItemChecklist(page, descricao, true);
    await expect(itemChecklist(page, exclusivoB)).toHaveCount(0);
    await selecionarViagemChecklist(page, outraViagem.nome);
    await validarItemChecklist(page, exclusivoB);
    await validarItemChecklist(page, descricao);
    await expect(itemChecklist(page, exclusivoA)).toHaveCount(0);
  });
});
