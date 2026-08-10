import { expect } from '@playwright/test';

export async function criarConta(page, name, email, password) {
  await page.goto('/login');
  const createAccountTab = page.getByRole('tab', { name: 'Criar conta' });

  // Repete o clique caso o Next.js ainda esteja hidratando a tela.
  await expect(async () => {
    await createAccountTab.click();
    await expect(createAccountTab).toHaveAttribute('aria-selected', 'true');
  }).toPass({ timeout: 10_000 });

  await expect(page.getByRole('heading', { name: 'Crie sua conta' })).toBeVisible();
  await page.getByLabel('Nome').fill(name);
  await page.getByLabel('E-mail').fill(email);
  await page.getByRole('textbox', { name: /Senha/ }).fill(password);
}
