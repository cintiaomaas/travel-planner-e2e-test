import { expect } from '@playwright/test';

/** Abre /login e seleciona a aba solicitada: Entrar ou Criar conta. */
export async function acessoAuth(page, tipoDeAcesso) {
  await page.goto('/login');
  const auth = page.getByRole('tab', { name: tipoDeAcesso });

  await auth.click();
}

/** Preenche os dados de cadastro; o envio do formulário fica a cargo do teste. */
export async function preencherCadastro(page, name, email, password) {
 await acessoAuth(page, 'Criar conta');
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('textbox', { name: /Senha/ }).fill(password);
}

/** Preenche e-mail e senha na aba Entrar, sem enviar o formulário. */
export async function preencherLogin(page, email, password) {
  await acessoAuth(page, 'Entrar');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await page.getByLabel('E-mail').fill(email);
  await page.locator('input[type="password"]').fill(password);
}

/** Envia o login e aguarda o carregamento dos dados e a chegada à página inicial. */
export async function entrarNaAplicacao(page, usuario) {
  await preencherLogin(page, usuario.email, usuario.password);
  const [resposta] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/planner' && response.request().method() === 'GET', { timeout: 15_000 }),
    page.getByRole('button', { name: 'Entrar', exact: true }).click(),
  ]);
  expect(resposta.ok(), 'Carregar os dados após o login').toBeTruthy();
  await expect(page).toHaveURL(/.*\/$/);
}
/**
 * Abre a página inicial usando a autenticação já presente no contexto e aguarda
 * os dados do servidor. Use no beforeEach de suítes que importam authFixture.
 * Não preenche nem envia o formulário de login.
 */
export async function abrirAplicacaoAutenticada(page) {
  const [resposta] = await Promise.all([
    page.waitForResponse(response => new URL(response.url()).pathname === '/api/planner' && response.request().method() === 'GET', { timeout: 15_000 }),
    page.goto('/'),
  ]);
  expect(resposta.ok(), 'Carregar os dados com a sessão autenticada').toBeTruthy();
}
