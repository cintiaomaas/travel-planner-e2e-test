export function formatarMoeda(valor) {
  /**
   * @param {valor} valor - Valor numérico a ser formatado
   * @return {string} - Valor formatado como moeda brasileira
   * Formata um valor numérico para o formato de moeda brasileira (BRL)
   * utilizando a função toLocaleString.
   */
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}