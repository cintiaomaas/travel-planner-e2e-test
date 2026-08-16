import { expect } from '@playwright/test';
import { formatarPeriodo } from '../helpers/dateHelper';

export async function preencherFormularioViagem(page, viagem) {
  /**
   * Preenche o formulário de cadastro de viagem com os dados fornecidos
   * @param {Page} page - Página do Playwright
   * @param {Object} viagem - Objeto com os dados da viagem
   */

  // Preencher Nome da Viagem
  if (viagem.nome !== undefined) {
    await page.locator('input[name="name"]').fill(viagem.nome);

  }

  // Preencher Destino
  if (viagem.destino !== undefined) {
    try {
      await page.locator('input[name="destination"]').fill(viagem.destino);
    } catch {
      await page.getByPlaceholder('Santiago').fill(viagem.destino);
    }
  }
  // Preencher País
  if (viagem.pais !== undefined) {
    try {
      await page.getByPlaceholder('Chile').fill(viagem.pais);
    } catch {
      await page.locator('input[placeholder*="country"]').fill(viagem.pais);
    }
  }

  // Preencher Data de Início
  if (viagem.dataInicio !== undefined) {
    await page.locator('input[name="startDate"]').fill(viagem.dataInicio);
  }

  // Preencher Data de Fim
  if (viagem.dataFim !== undefined) {
    await page.locator('input[name="endDate"]').fill(viagem.dataFim);
  }

  // Preencher Quantidade de viajantes
  if (viagem.viajantes !== undefined) {
    await page.locator('input[name="travelers"]').fill(viagem.viajantes);
  }

  // Preencher Orçamento
  if (viagem.orcamento !== undefined) {
    await page.locator('input[name="budget"]').fill(viagem.orcamento);
  }

  // Selecionar Status Planejada, Em andamento, Concluída
  await page.getByLabel('Status').selectOption(viagem.status);
}

export async function submeterFormulario(page) {
  await page.getByRole('button', { name: 'Criar viagem' }).click();
}

export async function preencherESubmeterViagem(page, viagem) {
  await preencherFormularioViagem(page, viagem);
  await submeterFormulario(page);
}

export async function validarMensagemSucesso(page, viagem) {
  /**
   * Verifica se a viagem foi cadastrada com sucesso
   * @param {Page} page - Página do Playwright
   * @param {Object} viagem - Objeto com os dados da viagem
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
  const mensagemErro = typeof mensagem === 'string'
    ? page.getByText(mensagem)
    : page.getByText(mensagem);

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
  await page.getByRole('button', { name: 'Minhas viagens' }).click();
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



