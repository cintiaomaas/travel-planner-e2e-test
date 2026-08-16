import { dataFutura } from '../helpers/dateHelper.js';
/**
 * Dados de Teste para Cadastro de Viagens
 */

export const viagem = {
  nome: 'Viagem de Férias - Espanha',
  destino: 'Espanha',
  pais: 'Madri',
  dataInicio: dataFutura(365),
  dataFim: dataFutura(372),
  viajantes: '2',
  orcamento: '5000.00',
  status: 'Planejada'
};

export const statusValidos = ['Planejada', 'Em Andamento', 'Concluída'];
