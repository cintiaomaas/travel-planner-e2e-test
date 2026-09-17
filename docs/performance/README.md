# Testes de Performance — Travel Planner

## Objetivo

Registrar as análises não funcionais de performance realizadas na aplicação Travel Planner, mantendo histórico dos resultados, evidências e pontos de melhoria identificados.

## Execução

| Informação   | Valor                                                  |
|--------------|--------------------------------------------------------|
| Data         | 17/09/2026                                             |
| Aplicação    | Travel Planner                                         |
| Ambiente     | Produção                                               |
| URL avaliada | `https://meu-travel-planner.vercel.app/`               |
| Ferramentas  | Google Lighthouse 13.4.1 e Chrome DevTools Performance |

## Resultados

### Lighthouse — Mobile

| Categoria      | Resultado |
|----------------|---:       |
| Performance    | 79        |
| Accessibility  | 91        |
| Best Practices | 100       |
| SEO            | 100       |

### Principais métricas

| Métrica                        | Resultado |
|--------------------------------|---:       |
| First Contentful Paint (FCP)   | 0,8 s     |
| Largest Contentful Paint (LCP) | 1,7 s     |
| Speed Index                    | 1,3 s     |
| Total Blocking Time (TBT)      | 920 ms    |
| Cumulative Layout Shift (CLS)  | 0         |
| Time to Interactive            | 2,2 s     |

## Análise

A execução apresentou bons resultados para carregamento visual e estabilidade de layout. O principal ponto de atenção identificado foi o **Total Blocking Time (TBT) de 920 ms**, que reduziu a pontuação geral de Performance para 79.

O relatório também registrou aproximadamente **3,9 s de trabalho na main thread** e **2,6 s de execução de JavaScript**, indicando oportunidade de investigar processamento JavaScript e tarefas que mantêm a thread principal ocupada.

Na captura do Chrome DevTools Performance foram observadas tarefas do renderer acima de 50 ms, incluindo execuções de aproximadamente **173 ms** e **90 ms**, reforçando a necessidade de avaliar tarefas longas durante a execução da aplicação.

## Pontos positivos

- FCP de 0,8 s.
- LCP de 1,7 s.
- CLS igual a 0, sem deslocamento visual relevante na execução do Lighthouse.
- Best Practices com pontuação 100.
- SEO com pontuação 100.
- Resposta inicial do servidor observada pelo Lighthouse em aproximadamente 20 ms.
- Nenhum erro de navegador registrado no console durante a execução do Lighthouse.

## Ponto de atenção

O TBT foi a principal métrica que apresentou impacto negativo. Recomenda-se investigar tarefas longas na main thread e o custo de execução de JavaScript antes de considerar o comportamento como um defeito da aplicação.

## Evidências

- `lighthouse/meu-travel-planner.vercel.app-20260917T185653.html`
- `devtools/Trace-20260917T190430.json`

> Os resultados representam uma execução específica e podem variar conforme dispositivo, rede, cache, carga do ambiente e condições de execução.

## Próximos passos

1. Repetir o teste em condições equivalentes para verificar consistência.
2. Analisar as tarefas longas identificadas no DevTools.
3. Avaliar scripts e processamento executados na main thread.
4. Registrar issue de performance caso o comportamento seja reproduzível e ultrapasse o critério de aceite definido para o projeto.
5. Manter novas execuções neste diretório para comparação histórica.
