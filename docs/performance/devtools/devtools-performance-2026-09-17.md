# Análise de Performance — Chrome DevTools

## Identificação

| Campo                                  | Informação                        |
|----------------------------------------|-----------------------------------|
| Data da execução                       | 17/09/2026                        |
| Ferramenta                             | Chrome DevTools — Performance     |
| Tipo                                   | Teste não funcional — Performance |
| Dispositivo                            | Responsive                        |
| Página registrada                      | `/login`                          |
| Duração aproximada da janela analisada | 7,09 s                            |

## Objetivo

Analisar a execução da aplicação no navegador e identificar atividades que possam manter a main thread ocupada e afetar a responsividade.

## Evidências observadas

O trace registra a navegação da página de login e eventos de execução do renderer.

Durante a captura foram identificadas tarefas do renderer superiores a 50 ms. Entre as maiores encontradas na thread principal do renderer estão aproximadamente:

| Tarefa  | Duração aproximada |
|---------|---:                |
| RunTask | 173 ms             |
| RunTask | 90 ms              |

O trace também registrou First Contentful Paint em aproximadamente 325 ms em um dos eventos de carregamento da página `/login`.

## Análise

Tarefas acima de 50 ms merecem atenção porque podem manter a thread principal ocupada e atrasar a resposta da interface durante sua execução.

A presença dessas tarefas é coerente com o ponto de atenção observado no Lighthouse, que registrou TBT de 920 ms. Entretanto, as duas medições possuem contextos e condições próprias e não devem ser tratadas como valores diretamente equivalentes.

## Evidência

Manter o trace original junto desta documentação:

`Trace-20260917T190430.json`

O arquivo pode ser importado novamente no painel **Performance** do Chrome DevTools para inspeção detalhada da timeline.

## Conclusão

A captura indica oportunidade de investigação de tarefas executadas na main thread. Recomenda-se localizar a origem das tarefas mais longas, verificar o JavaScript associado e repetir a execução para confirmar a recorrência antes de registrar um defeito de performance.
