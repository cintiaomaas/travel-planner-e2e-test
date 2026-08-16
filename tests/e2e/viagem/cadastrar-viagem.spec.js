import { test, expect } from '@playwright/test';
import { preencherLogin } from '../../pages/autenticacaoPage.js';
import { loginUsuarioExistente } from '../../data/usuarios.js';
import {
  navegarParaMinhasViagens,
  preencherFormularioViagem,
  submeterFormulario,
  preencherESubmeterViagem,
  validarMensagemSucesso,
  validarViagemCriada,
  validarMensagemErro,
  validarPeriodoViagem,
} from '../../pages/viagemPage.js';
import { viagem, statusValidos } from '../../data/viagens.js';
import { dataAtual, dataPassada, dataFutura } from '../../helpers/dateHelper.js';


/* 
Teste para validar o fluxo de cadastro de viagens no Travel Planner.
*/

test.describe('Cadastro de Viagens', () => {
  // Setup: Login antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Login do usuário
    await preencherLogin(page, loginUsuarioExistente.email, loginUsuarioExistente.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/.*\/$/, { timeout: 10_000 });
    //Clica no botão Nova Viagem
    await page.getByRole('button', { name: ' Nova viagem' }).click();

  });

  test.describe('Validar cadastro de viagem', () => {

    test('Deve cadastrar viagem com dados válidos', async ({ page }) => {
      // Arrange & Act
      await preencherESubmeterViagem(page, viagem);
      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, viagem.nome);
    });
  })

  test.describe('Validar campos do formulário de viagem', () => {

    test('Deve aceitar período de viagem de um dia (limite mínimo)', async ({ page }) => {
      const viagemUmDia = {
        ...viagem,
        dataInicio: '2024-06-15',
        dataFim: '2024-06-15'
      };

      // Arrange & Act
      await preencherESubmeterViagem(page, viagemUmDia);
      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, viagem.nome);
      await validarPeriodoViagem(page, viagemUmDia.dataInicio, viagemUmDia.dataFim);
    });

    test('Deve aceitar período de viagem muito longo (limite máximo)', async ({ page }) => {
      const viagemPeriodoLongo = {
        ...viagem,
        dataInicio: '2026-09-15',
        dataFim: '2027-09-14',
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, viagemPeriodoLongo);
      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, viagemPeriodoLongo.nome);
      await validarPeriodoViagem(page, viagemPeriodoLongo.dataInicio, viagemPeriodoLongo.dataFim);
    });

    test('Deve aceitar orçamento zero (limite mínimo)', async ({ page }) => {
      const viagemOrcamentoZero = {
        ...viagem,
        orcamento: '0.00'
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, viagemOrcamentoZero);

      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, viagemOrcamentoZero.nome);
      await expect(page.getByText(`Orçamento R$ ${Number(viagemOrcamentoZero.orcamento)}`)).toBeVisible(); //Number converte 0.00 em 0
    });

    test('BUG - Deve aceitar orçamento muito alto (limite máximo)', async ({ page }) => {
      const viagemOrcamentoAlto = {
        ...viagem,
        orcamento: '999999.99'
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, viagemOrcamentoAlto);

      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, viagemOrcamentoAlto.nome);
      await expect(page.getByText(`Orçamento R$ ${viagemOrcamentoAlto}`)).toBeVisible();
    });

    test('Deve aceitar nome da viagem com caractere mínimo', async ({ page }) => {
      const descricaoViagemMinima = {
        ...viagem,
        nome: 'T'

      }
      // Arrange & Act
      await preencherESubmeterViagem(page, descricaoViagemMinima);

      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, descricaoViagemMinima.nome);
    });

    test('Deve aceitar nome da viagem com muitos caracteres (limite máximo)', async ({ page }) => {
      const descricaoViagemMaxima = {
        ...viagem,
        nome: 'teste de valor maximo do campo de nome da viagem para validação'
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, descricaoViagemMaxima);

      // Assert
      await validarMensagemSucesso(page);
      await validarViagemCriada(page, descricaoViagemMaxima.nome);
    });

    test('Deve aceitar data de início hoje (limite mínimo)', async ({ page }) => {
      const viagemDataHoje = {
        ...viagem,
        dataInicio: dataAtual(),
        dataFim: dataAtual(10)
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, viagemDataHoje);

      // Assert
      await validarMensagemSucesso(page);
      await validarPeriodoViagem(page, viagemDataHoje.dataInicio, viagemDataHoje.dataFim);
    });
  });

  test.describe('Valida campos de datas inicial e final', () => {

    test('BUG - Não deve permitir data final anterior à data inicial', async ({ page }) => {
      const dataFinalAnterior = {
        ...viagem,
        dataFim: dataPassada(10),
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, dataFinalAnterior);
      // Assert
      await validarMensagemErro(page, mensagem => 'A data final não pode ser anterior à data inicial.');
    });

    test('Deve permitir datas no passado', async ({ page }) => {
      const viagemDataPassado = {
        ...viagem,
        dataInicio: '2025-05-10',
        dataFim: '2025-05-20',
      }
      // Arrange & Act
      await preencherESubmeterViagem(page, viagemDataPassado);

      // Assert
      await validarMensagemSucesso(page);
      await validarPeriodoViagem(page, viagemDataPassado.dataInicio, viagemDataPassado.dataFim);
    });

    test('BUG - Não Deve permitir que a data início esteja nula', async ({ page }) => {
        const dataInicioNula = {
        ...viagem,
        dataInicio: '',
      };

      // Act
      await preencherESubmeterViagem(page, dataInicioNula);

      // Assert
      await validarMensagemSucesso(page);
      await validarMensagemErro(page, mensagem => 'A data de início é inválida');
    });
  });

  test.describe('Valida regra de orçamento', () => {
    /**
     * Testes de cenários negativos com dados inválidos
     * Valida que a aplicação rejeita dados malformados
     */

    test('BUG - Não deve aceitar orçamento negativo', async ({ page }) => {
      // Arrange & Act
      await preencherESubmeterViagem(page, {
        ...viagem,
        nome: 'Teste Orçamento Negativo',
        orcamento: '-500',
      });

      // Assert
      await validarMensagemErro(page, mensagem => 'O valor deve ser maior ou igual a 0.');
    });

    test('BUG - Não deve aceitar valores especiais no orçamento', async ({ page }) => {
      // Arrange & Act
      await preencherESubmeterViagem(page, {
        ...viagem,
        nome: 'Teste Orçamento Especial',
        orcamento: '@#$%',

      });

      // Assert
      await validarMensagemErro(page, mensagem => 'O valor deve ser maior ou igual a 0.');
    });
  });

  test.describe('Valida histórico de viagens', () => {

    test('Viagem deve permanecer disponível após recarregar a página', async ({ page }) => {
      // Arrange
      const viagemPersistencia = {
      ...viagem,
        nome: 'Viagem Persistência Teste',
      };

      // Act 1: Cadastrar viagem
      await preencherESubmeterViagem(page, viagemPersistencia);
      await validarMensagemSucesso(page);

      // Act 2: Recarregar a página
      await page.reload();
      await navegarParaMinhasViagens(page, viagemPersistencia.nome);
      // Assert: Viagem deve estar na lista
      await validarViagemCriada(page, viagemPersistencia.nome);
    });

    test('Devem ser possível cadastrar múltiplas viagens independentes para mesma data', async ({ page }) => {
      // Arrange
      const viagem1 = {
        nome: 'Viagem Múltipla 1',
        destino: 'França',
        pais: 'Paris',
        dataInicio: dataFutura(),
        dataFim: dataFutura(10),
        orcamento: '5000',
        status: 'Planejada'
      };

      const viagem2 = {
        nome: 'Viagem Múltipla 2',
        destino: 'Barcelona',
        pais: 'Espanha',
        dataInicio: dataFutura(),
        dataFim: dataFutura(10),
        orcamento: '8000',
        status: 'Planejada'
      };

      // Act: Cadastrar primeira viagem
      await preencherESubmeterViagem(page, viagem1);
      await validarMensagemSucesso(page);

      // Act: Cadastrar segunda viagem
      await page.getByRole('button', { name: 'Visão geral', exact: true }).click();
      await page.getByRole('button', { name: 'Nova viagem' }).click();
      await preencherESubmeterViagem(page, viagem2);
      await validarMensagemSucesso(page);

      // Assert: Ambas as viagens devem estar visíveis
      await page.getByRole('button', { name: 'Minhas viagens', exact: true }).click();
      await validarViagemCriada(page, viagem1.nome);
      await validarViagemCriada(page, viagem2.nome);
    });
  });

});