import { expect } from '@playwright/test';
import { formatarPeriodo } from '../helpers/dateHelper';

export async function preencherFormularioViagem(page, viagem) {
  /**
   * Preenche o formulário de cadastro de viagem com os dados fornecidos
   * @param {Page} page - Página do Playwright
   * @param {Object} viagem - Objeto com os dados da viagem
   */

  // Preencher Nome da Viagem
  await page.locator('input[name="name"]').fill(viagem.nome);
  // Preencher Destino
  await page.getByRole('combobox', { name: 'Destino' }).click();
  await page.getByRole('combobox', { name: 'Destino' }).fill(viagem.destino);
  await page.getByRole('option', { name: viagem.pais }).click();
  // Preencher Data de Início
  await page.getByRole('textbox', { name: 'Data de ida' }).fill(viagem.dataInicio);
  // Preencher Data de Fim
  await page.getByRole('textbox', { name: 'Data de volta' }).fill(viagem.dataFim);
  // Preencher Quantidade de viajantes
  await page.locator('input[name="travelers"]').fill(viagem.viajantes);
  // Preencher Orçamento
  await page.locator('input[name="budget"]').fill(viagem.orcamento);
  // Selecionar Status Planejada, Em andamento, Concluída
  await page.getByRole('dialog').getByLabel('Status').selectOption(viagem.status);
}

export async function submeterFormulario(page) {
  await page.getByRole('button', { name: 'Criar viagem' }).click();
}

export async function preencherESubmeterViagem(page, viagem) {
  /**
   * @param {Page} page - Página do Playwright
   * @param {Object} viagem - Objeto com os dados da viagem
   * Preenche o formulário de cadastro de viagem e submete
   */
  await preencherFormularioViagem(page, viagem);
  await submeterFormulario(page);
}

export async function validarMensagemSucesso(page) {
  /**
   * Verifica se a viagem foi cadastrada com sucesso
   * @param {Page} page - Página do Playwright
   */

  try {
    // Valida o toast
    await expect(
      page.getByText(/foi criada com um checklist inicial/i)
    ).toBeVisible({ timeout: 5000 });

  } catch (e) {
    throw new Error(
      'Nenhuma mensagem de sucesso foi encontrada'
    );
  }
}

export async function validarViagemCriada(page, nomeViagem) {
  const tituloViagem = page.getByRole('heading', {
    name: nomeViagem,
    exact: true //valida o nome específico da viagem criada
  });
  await expect(tituloViagem).toBeVisible({ timeout: 5000 });
}

export async function validarMensagemErro(page, mensagem) {
  /**
   * Verifica se uma mensagem de erro específica é exibida
   * @param {Page} page - Página do Playwright
   * @param {RegExp|string} mensagem - Padrão da mensagem de erro
   */
  const mensagemErro = page.getByText(mensagem);

  await expect(mensagemErro).toBeVisible({ timeout: 5000 });
}

export async function buscarViagemPorNome(page, nomeViagem) {
  /**
   * Busca uma viagem específica na lista
   * @param {Page} page - Página do Playwright
   * @param {string} nomeViagem - Nome da viagem
   */
  const campoBusca = page.getByPlaceholder('Buscar viagem, destino ou ano...');

  if (await campoBusca.isVisible()) {
    await campoBusca.fill(nomeViagem);
  }
}

/**
 * Pesquisar histórico em minhas viagens
 * @param {*} page pagina do playwright
 * @param {*} nomeViagem objeto com nome da viagem
 */

export async function navegarParaMinhasViagens(page, nomeViagem) {
  const botao = page.locator('aside nav button').filter({
    has: page.locator('span', { hasText: /^Minhas viagens$/ }),
  });
  await botao.click();
  await page.getByPlaceholder('Buscar por cidade ou país').fill(nomeViagem);
}

/**
 * Valida periodo da viagem
 * @param {*} page pagina do plawright
 * @param {*} dataInicio data inicio da viagem
 * @param {*} dataFim data fim da viagem
 */
export async function validarPeriodoViagem(page, dataInicio, dataFim) {
  const periodoEsperado = formatarPeriodo(
    dataInicio,
    dataFim
  );
  await expect(page.getByText(periodoEsperado)).toBeVisible();
}

/**
 * Exclui uma viagem específica
 * @param {*} page pagina do playwright
 * @param {*} viagem objeto com nome da viagem
 */

export async function navegarMinhasViagensExcluirViagem(page, viagem) {
  await navegarParaMinhasViagens(page, viagem);
  // Espera o próximo diálogo nativo do navegador e confirma automaticamente, 
  // como clicar em OK na pergunta “Deseja excluir esta viagem?
  // dialog.accept() é chamado para aceitar o diálogo, permitindo que a ação de exclusão prossiga.
    page.once('dialog', async dialog => {
    await dialog.accept();
  });
  await page.getByRole('button', { name: `Excluir ${viagem}`, exact: true }).click();
  await expect(page.getByText('Viagem excluída.')).toBeVisible();
  await expect(page.getByRole('heading', { name: viagem, exact: true })).not.toBeVisible();
  await expect(page.getByText('Nenhuma viagem por aqui')).toBeVisible();
}

export async function excluirViagem(page, viagem) {
  // Espera o próximo diálogo nativo do navegador e confirma automaticamente, 
  // como clicar em OK na pergunta “Deseja excluir esta viagem?
  // dialog.accept() é chamado para aceitar o diálogo, permitindo que a ação de exclusão prossiga.
    page.once('dialog', async dialog => {
    await dialog.accept();
  });
  await page.getByRole('button', { name: `Excluir ${viagem}`, exact: true }).click();
  await expect(page.getByText('Viagem excluída.')).toBeVisible();
  await expect(page.getByRole('heading', { name: viagem, exact: true })).not.toBeVisible();
  await expect(page.getByText('Nenhuma viagem por aqui')).toBeVisible();
}





