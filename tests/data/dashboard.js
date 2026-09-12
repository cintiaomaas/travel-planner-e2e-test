import { viagem } from './viagens.js';

export const viagemDashboard = { ...viagem, nome: 'Teste dashboard', orcamento: '5000' };

export const despesasDashboard = [
  { descricao: 'Hotel dashboard', categoria: 'Hospedagem', valor: 1000, pago: true },
  { descricao: 'Almoço dashboard', categoria: 'Alimentação', valor: 500, pago: false },
  { descricao: 'Jantar dashboard', categoria: 'Alimentação', valor: 500, pago: false },
];
