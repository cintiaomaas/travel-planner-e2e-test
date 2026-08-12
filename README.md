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
│   │   └── usuarios.js
│   ├── e2e/
│   │   ├── cadastrar-usuarios.spec.js
│   │   └── login-usuarios.spec.js
│   ├── helpers/
│   │   └── database.js
│   └── pages/
│       └── autenticacaoPage.js
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

O projeto usa o Google Chrome. Em ambiente local, o navegador é exibido por padrão; no CI, a execução ocorre em modo headless.
