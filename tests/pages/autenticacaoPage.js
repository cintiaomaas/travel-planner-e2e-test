import { expect } from '@playwright/test';

export async function acessoAuth(page, tipoDeAcesso) {
  await page.goto('/login');
  const auth = page.getByRole('tab', { name: tipoDeAcesso });

  await auth.click();
}

export async function preencherCadastro(page, name, email, password) {
 await acessoAuth(page, 'Criar conta');
  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('textbox', { name: /Senha/ }).fill(password);
}

export async function preencherLogin(page, email, password) {
  await acessoAuth(page, 'Entrar');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await page.getByLabel('E-mail').fill(email);
  await page.locator('input[type="password"]').fill(password);
}