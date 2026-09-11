# Travel Planner — testes E2E

Suíte de testes Web end-to-end do Travel Planner, desenvolvida com Playwright e executada no Google Chrome.

## Pré-requisitos

- Node.js 22 ou uma versão compatível;
- npm;
- Google Chrome;
- acesso à aplicação Travel Planner;
- acesso ao banco MySQL da aplicação para executar os testes de cadastro.

## Estrutura do projeto

```text
travel-planner-e2e-test/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── tests/
│   ├── data/
│   │   ├── checklist.js
│   │   ├── usuarios.js
│   │   └── viagens.js
│   ├── e2e/
│   │   ├── checklist/
│   │   │   └── gerenciar-checklist.spec.js
│   │   ├── login/
│   │   │   ├── cadastrar-usuarios.spec.js
│   │   │   └── login-usuarios.spec.js
│   │   ├── orcamento/
│   │   │   └── integracao-orcamento-despesas.spec.js
│   │   └── viagem/
│   │       └── cadastrar-viagem.spec.js
│   ├── helpers/
│   │   ├── currencyHelper.js
│   │   ├── database.js
│   │   └── dateHelper.js
│   └── pages/
│       ├── autenticacaoPage.js
│       ├── checklistPage.js
│       ├── orcamentoPage.js
│       └── viagemPage.js
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── playwright.config.js
└── README.md
```

## Instalação e configuração

1. Na pasta do projeto, instale as dependências:

```powershell
npm ci
```

2. Instale o Google Chrome usado pelo Playwright:

```powershell
npx playwright install chrome
```

Como o projeto mantém o vídeo das execuções que falham, instale também o FFmpeg:

```powershell
npx playwright install ffmpeg
```

Caso a execução de `npx.ps1` esteja bloqueada pela política do PowerShell, use `npx.cmd`:

```powershell
npx.cmd playwright install chrome ffmpeg
```

3. Crie o arquivo `.env` a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

Configure as variáveis:

```env
E2E_BASE_URL=https://meu-travel-planner.vercel.app/
E2E_DATABASE_URL=mysql://usuario:senha@localhost:3306/travel_planner
```

- `E2E_BASE_URL` define a aplicação testada. Substitua o valor por `http://localhost:3000/` para testar uma instância local;
- `E2E_DATABASE_URL` define a conexão usada para remover o usuário de teste antes e depois dos cenários de cadastro.

Quando `E2E_DATABASE_URL` não está definida, o helper procura `DATABASE_URL` no ambiente. Se nenhuma das duas existir, ele tenta carregar `DATABASE_URL` de `../travel-planner/.env`.

O arquivo `.env` pode conter credenciais e não deve ser versionado. Mantenha apenas valores fictícios no `.env.example`.

## Executando os testes

Executar os onze cenários independentes de checklist:

```powershell
npx.cmd playwright test tests/e2e/checklist
```

Os cenários cobrem checklist básico automático (12 itens em quatro grupos para a viagem internacional, todos pendentes e com progresso zero), inclusão, campo obrigatório (vazio e espaços), conclusão, desmarcação, edição, exclusão, múltiplos itens, exibição por grupo, persistência dos estados e associação à viagem. O beforeAll cria uma viagem compartilhada pela suíte. O beforeEach abre essa viagem em um novo contexto autenticado e gera nomes exclusivos para os itens de cada cenário. O cenário de checklist automático cria uma viagem própria; o de associação cria uma segunda viagem para comparação. O afterAll remove todas as viagens do usuário exclusivo da automação com deleteViagensDoUsuario. Em caso de falha, o Playwright pode reiniciar o worker e executar os hooks novamente para os testes restantes. As funções de interação e preparação ficam em tests/pages/checklistPage.js. A suíte reutiliza o usuário de teste existente e requer acesso ao banco configurado para essa limpeza. As alterações aguardam a sincronização em `/api/planner` antes das verificações após recarregar a página. Não há uso de `test.step` nesses cenários.

Executar toda a suíte:

```powershell
npm run test:e2e
```

Executar com o navegador visível:

```powershell
npm run test:e2e:headed
```

Abrir o modo interativo do Playwright:

```powershell
npm run test:e2e:ui
```

Abrir o último relatório HTML:

```powershell
npm run test:e2e:report
```
## Relatórios dos testes

```
Os testes E2E geram automaticamente um relatório HTML do Playwright com os resultados da execução.

### GitHub Pages

Após a execução da pipeline na branch `main`, o relatório mais recente é publicado automaticamente no GitHub Pages.

Acesse:

👉 `https://SEU-USUARIO.github.io/travel-planner-e2e-test/`

O relatório permite visualizar:
- testes executados;
- testes aprovados e com falha;
- tempo de execução;
- erros e evidências geradas pelo Playwright.

### GitHub Actions

Os relatórios e evidências também ficam disponíveis como artifacts da execução por **7 dias**.

Para acessar:

1. Vá até a aba **Actions** do repositório.
2. Selecione a execução desejada.
3. Na seção **Artifacts**, baixe o arquivo `playwright-report`.
```

O projeto usa o Google Chrome. Em ambiente local, o navegador é exibido por padrão; no CI, a execução ocorre em modo headless.
