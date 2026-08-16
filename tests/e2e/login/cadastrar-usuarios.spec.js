import { test, expect } from '@playwright/test';
import { deleteUserByEmail } from '../../helpers/database.js';
import { preencherCadastro } from '../../pages/autenticacaoPage.js';
import { testUser } from '../../data/usuarios.js';


test.describe('Cadastro de Usuários', () => {
  test.beforeEach(async () => {
    await deleteUserByEmail(testUser.email);
  });

  test.afterEach(async () => {
    await deleteUserByEmail(testUser.email);
  });

  test('Deve cadastrar um novo usuário com sucesso', async ({ page }) => {
    await preencherCadastro(page, testUser.name, testUser.email, testUser.password);

    await Promise.all([
      page.waitForURL((url) => url.pathname === '/', { timeout: 60_000 }),
      page.getByRole('button', { name: 'Criar conta e entrar' }).click(),
    ]);

    await expect(
      page.getByRole('heading', { name: 'Olá, João' }),
    ).toBeVisible();
  })

  test('Não deve permitir e-mail inválido', async ({ page }) => {
    await preencherCadastro(page, testUser.name, 'joao@emailinvalido', testUser.password);
    await page.getByRole('button', { name: 'Criar conta e entrar' }).click();
    await expect(page.getByText('Confira os dados informados para criar sua conta.')).toBeVisible();
  })

  test('Não deve permitir senha com menos de 8 caracteres', async ({ page }) => {
    await preencherCadastro(page, testUser.name, testUser.email, '123');
    await page.getByRole('button', { name: 'Criar conta e entrar' }).click();
    await expect(
      page.getByRole('alert').filter({
        hasText: 'A senha deve ter pelo menos 8 caracteres.',
      }),
    ).toBeVisible();
  })

  test('Não deve permitir cadastro com e-mail já existente', async ({ page }) => {
    await preencherCadastro(page, 'teste', 'teste@teste.com', 'senha1234');
    await page.getByRole('button', { name: 'Criar conta e entrar' }).click();
    await expect(page.getByRole('alert')
      .filter({ hasText: 'Já existe uma conta cadastrada com este e-mail.' })).toBeVisible();
  })
})
