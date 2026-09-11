import { randomUUID } from 'node:crypto';
import { viagem } from './viagens.js';

export function criarViagemChecklist() {
  return { ...viagem, nome: `checklist ${randomUUID()}` };
}

export const itensChecklist = [
  { descricao: 'Separar cópia do passaporte', grupo: 'Documentos' },
  { descricao: 'Confirmar reserva do hotel', grupo: 'Reservas e roteiro' },
  { descricao: 'Guardar comprovante do seguro', grupo: 'Documentos' },
];

export function criarItensChecklist() {
  const identificador = randomUUID();
  return itensChecklist.map(item => ({ ...item, descricao: `${item.descricao} ${identificador}` }));
}

// Expectativas explícitas do checklist inicial para a viagem de teste à Espanha.
export const checklistBasicoInternacional = [
  { nome: 'Documentos', itens: ['Passaporte', 'Visto', 'Contratar seguro viagem', 'Imprimir documentos'] },
  { nome: 'Reservas e roteiro', itens: ['Passagens', 'Hospedagem', 'Montar roteiro'] },
  { nome: 'Preparação internacional', itens: ['Comprar moeda ou habilitar cartão internacional', 'Chip internacional'] },
  { nome: 'Bagagem', itens: ['Bagagem', 'Adaptador de tomadas', 'Medicamentos'] },
];
