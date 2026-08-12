import { test, expect } from '@playwright/test';
import { preencherLogin } from '../pages/autenticacaoPage.js';
import { loginUsuarioExistente } from '../data/usuarios.js';

test.describe('Login de Usuários', () => {
    test('Deve permitir que um usuário logue com sucesso', async ({ page }) => {
        await preencherLogin(page, loginUsuarioExistente.email, loginUsuarioExistente.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByRole('heading', { name: 'Olá, teste' })).toBeVisible();
    })

    test('Não deve permitir login com e-mail inválido', async ({ page }) => {
        await preencherLogin(page, 'test@@emailinvalido.com', loginUsuarioExistente.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('Confira os dados informados para entrar na sua conta.')).toBeVisible();
    })

    test('Não deve permitir login com senha incorreta', async ({ page }) => {
        await preencherLogin(page, loginUsuarioExistente.email, 'senh1234');
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('Confira os dados informados para entrar na sua conta.')).toBeVisible();
    })

    test('Não deve permitir login com e-mail não cadastrado', async ({ page }) => {
        await preencherLogin(page, 'emailnaocadastrado@example.com', loginUsuarioExistente.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('Confira os dados informados para entrar na sua conta.')).toBeVisible();
    })

    test('Não deve permitir login com campos vazios', async ({ page }) => {
        await preencherLogin(page, '', '');
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('Confira os dados informados para entrar na sua conta.')).toBeVisible();
    })

    test('Não deve permitir login com e-mail válido e senha vazia', async ({ page }) => {
        await preencherLogin(page, loginUsuarioExistente.email, '');
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeVisible();
    })

    test('Não deve permitir login com e-mail vazio e senha válida', async ({ page }) => {
        await preencherLogin(page, '', loginUsuarioExistente.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByText('Confira os dados informados para entrar na sua conta.')).toBeVisible();
    })

    test('Deve permitir desologar um usuário logado com sucesso', async ({ page }) => {
        await preencherLogin(page, loginUsuarioExistente.email, loginUsuarioExistente.password);
        await page.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByRole('heading', { name: 'Olá, teste' })).toBeVisible();
        await page.locator('header').getByRole('button', { name: 'Sair da conta' }).click();
        await expect(page).toHaveURL(/\/login/);
    })
})
