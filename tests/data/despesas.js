import { viagem } from './viagens.js';

export const viagemDespesas = { ...viagem, nome: 'Teste despesas', orcamento: '5000' };
export const viagemAssociacao = { ...viagemDespesas, nome: 'Teste associação despesas' };
export const despesa = { descricao: 'Hotel despesas', categoria: 'Hospedagem', valor: 125.50, pago: false };
export const segundaDespesa = { descricao: 'Almoço despesas', categoria: 'Alimentação', valor: 74.50, pago: true };
export const despesaEditada = { descricao: 'Transporte atualizado', categoria: 'Transporte', valor: 250, pago: true };
