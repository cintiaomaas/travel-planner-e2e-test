/**
 * Formata uma data no padrão YYYY-MM-DD.
 *
 * @param {Date} data - Data que será formatada.
 * @returns {string} Data formatada no padrão YYYY-MM-DD.
 */
function formatarData(data) {
  return data.toISOString().split('T')[0];
}

export function dataAtual() {
  return formatarData(new Date());
}

/**
 * Retorna uma data futura com base na quantidade de dias informada.
 *
 * @param {number} dias - Quantidade de dias que será adicionada à data atual.
 * @returns {string} Data futura formatada no padrão YYYY-MM-DD.
 */
export function dataFutura(dias = 1) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return formatarData(data);
}

/**
 * Retorna uma data passada com base na quantidade de dias informada.
 *
 * @param {number} dias - Quantidade de dias que será subtraída da data atual.
 * @returns {string} Data passada formatada no padrão YYYY-MM-DD.
 */
export function dataPassada(dias = 1) {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return formatarData(data);
}

/**
* Formata o período da viagem conforme exibido na tela.
 *
 * @param {string} dataInicio - Data de início no formato YYYY-MM-DD.
 * @param {string} dataFim - Data de fim no formato YYYY-MM-DD.
 * @returns {string} Período formatado, por exemplo: "15 de jun — 15 de jun 2024".
 */
export function formatarPeriodo(dataInicio, dataFim) {
  const inicio = new Date(`${dataInicio}T00:00:00`);
  const fim = new Date(`${dataFim}T00:00:00`);

  const formatar = (data) =>
    data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    }).replace('.', '');

  return `${formatar(inicio)} — ${formatar(fim)} ${fim.getFullYear()}`;
};