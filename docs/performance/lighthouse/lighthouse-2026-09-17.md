# Relatório de Performance — Lighthouse

## Identificação

| Campo | Informação |
|---|---|
| Data da execução | 17/09/2026 |
| Ferramenta | Google Lighthouse 13.4.1 |
| Tipo | Teste não funcional — Performance |
| Ambiente | Produção |
| Perfil | Mobile |
| URL | `https://meu-travel-planner.vercel.app/` |

## Resultado geral

| Categoria | Pontuação |
|---|---:|
| Performance | **79** |
| Accessibility | **91** |
| Best Practices | **100** |
| SEO | **100** |

## Métricas de Performance

| Métrica | Resultado |
|---|---:|
| First Contentful Paint (FCP) | 0,8 s |
| Largest Contentful Paint (LCP) | 1,7 s |
| Speed Index | 1,3 s |
| Total Blocking Time (TBT) | **920 ms** |
| Cumulative Layout Shift (CLS) | 0 |
| Time to Interactive | 2,2 s |

## Diagnóstico

Os tempos de carregamento visual apresentaram resultados positivos nesta execução. O FCP ocorreu em 0,8 s, o LCP em 1,7 s e o Speed Index em 1,3 s.

O principal ponto de atenção foi o **Total Blocking Time de 920 ms**. O relatório também registrou cerca de **3,9 s de trabalho da main thread** e **2,6 s de execução de JavaScript**.

O CLS foi 0, indicando ausência de deslocamentos visuais relevantes durante a medição.

## Evidência

Manter o relatório HTML original junto desta documentação:

`meu-travel-planner.vercel.app-20260917T185653.html`

## Conclusão

A execução obteve **79 pontos em Performance**. Os resultados de carregamento visual e estabilidade foram satisfatórios, porém o TBT merece investigação por indicar períodos em que a thread principal permaneceu ocupada.

Antes de abrir um defeito, recomenda-se repetir a medição e definir um critério de aceite de performance para o projeto.
