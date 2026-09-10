import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { preencherLogin } from '../../pages/autenticacaoPage.js';
import { preencherESubmeterViagem, validarViagemCriada } from '../../pages/viagemPage.js';
import { loginUsuarioExistente } from '../../data/usuarios.js';
import { viagem } from '../../data/viagens.js';
import { deleteViagemDeIntegracao } from '../../helpers/database.js';
import {
  alterarESincronizar, cadastrarDespesa, editarDespesa, excluirDespesa, validarSaldo,
} from '../../pages/orcamentoPage.js';

const test = base.extend({
  viagemOrcamento: async ({ page, context }, use) => {
    const dados = { ...viagem, nome: `orçamento ${randomUUID()}`, orcamento: '5000,00' };
    let selecaoAnterior = '';
    try {
      await preencherLogin(page, loginUsuarioExistente.email, loginUsuarioExistente.password);
      const [resposta] = await Promise.all([
        page.waitForResponse(response => new URL(response.url()).pathname === '/api/planner' && response.request().method() === 'GET'),
        page.getByRole('button', { name: 'Entrar', exact: true }).click(),
      ]);
      expect(resposta.ok(), 'Carregar os dados existentes antes de criar a viagem').toBeTruthy();
      selecaoAnterior = (await resposta.json()).data?.selectedTripId ?? '';
      await expect(page).toHaveURL(/.*\/$/);
      await page.getByRole('button', { name: 'Nova viagem', exact: true }).click();
      await alterarESincronizar(page, dados.nome, 0, 0, () => preencherESubmeterViagem(page, dados));
      await validarViagemCriada(page, dados.nome);
      await use(dados);
    } finally {
      // Fechar o navegador antes da limpeza impede novas sincronizações de dados antigos.
      try {
        await context.close();
      } finally {
        await deleteViagemDeIntegracao(loginUsuarioExistente.email, dados.nome, selecaoAnterior);
      }
    }
  },
});

test('Deve integrar o orçamento ao cadastrar, editar e excluir uma despesa', async ({ page, viagemOrcamento }) => {
  test.setTimeout(90_000);
  const nome = viagemOrcamento.nome;
  const descricao = 'Hospedagem - integração orçamento';

  await test.step('Orçamento de R$ 5.000 sem despesas: saldo de R$ 5.000', async () => {
    await validarSaldo(page, 5000, 0);
  });
  await test.step('Adicionar despesa de R$ 1.000: saldo de R$ 4.000', async () => {
    await alterarESincronizar(page, nome, 1000, 1, () => cadastrarDespesa(page, descricao, '1000,00'));
    await validarSaldo(page, 4000, 1000);
  });
  await test.step('Editar a mesma despesa para R$ 1.500: saldo de R$ 3.500', async () => {
    await alterarESincronizar(page, nome, 1500, 1, () => editarDespesa(page, descricao, '1500,00'));
    await validarSaldo(page, 3500, 1500);
  });
  await test.step('Excluir a despesa: saldo retorna para R$ 5.000', async () => {
    await alterarESincronizar(page, nome, 0, 0, () => excluirDespesa(page, descricao));
    await validarSaldo(page, 5000, 0);
  });
});
