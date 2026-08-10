# travel-planner-e2e-test

Automatizar testes web do app travel-planner

## Pré-requisitos

- Node.js e npm instalados;
- Google Chrome instalado;
- aplicação Travel Planner em execução;
- acesso ao banco MySQL utilizado pela aplicação.

## Estrutura do projeto

```text
travel-planner-e2e-test/
|-- tests/
|   |-- e2e/
|   |   `-- cadastrarUsuarios.spec.js
|   `-- support/
|       |-- database.js
|       `-- pages/
|           `-- criarConta.js
|-- .env.example
|-- .gitignore
|-- package.json
|-- package-lock.json
|-- playwright.config.js
`-- README.md
```

## Configuração

1. Instale as dependências:

```powershell
npm install
```

2. Crie o arquivo `.env` com base no `.env.example`:

```env
E2E_BASE_URL=http://localhost:3000/
E2E_DATABASE_URL=mysql://usuario:senha@localhost:3306/travel_planner
```

`E2E_BASE_URL` define o endereço da aplicação. `E2E_DATABASE_URL` permite remover os usuários criados pelos testes. No ambiente local, quando essa variável não está definida, o projeto tenta carregar `DATABASE_URL` de `../travel-planner/.env`.

O arquivo `.env` contém credenciais e não deve ser versionado. Use somente valores fictícios no `.env.example`.

3. Caso o Playwright solicite o componente de vídeo, instale o FFmpeg:

```powershell
npx playwright install ffmpeg
```

## Executando os testes

Executar todos os testes no Google Chrome:

```powershell
npm run test:e2e
```

Abrir o modo interativo do Playwright:

```powershell
npm run test:e2e:ui
```

Abrir o último relatório HTML:

```powershell
npm run test:e2e:report
```

O relatório é gerado automaticamente, mas não é aberto ao final da execução. Os testes executam sequencialmente porque compartilham dados de cadastro.

## Integração contínua

O workflow `.github/workflows/playwright.yml` executa automaticamente:

- em pull requests direcionados à branch `main`;
- em pushes realizados na branch `main`;
- manualmente pela opção `workflow_dispatch` do GitHub Actions.

O job cria um MySQL temporário, baixa a aplicação `cintiaomaas/travel-planner`, aplica o schema Prisma, inicia o Next.js e executa os testes no Google Chrome em modo headless. Nenhuma credencial de produção é utilizada.

Ao final, o workflow publica o relatório HTML, as evidências do Playwright e o log da aplicação como artifact por 14 dias. O job `Testes E2E no Chrome` pode ser configurado como status check obrigatório nas regras de proteção da branch `main` para impedir integrações quando houver falhas.

<hr>
Autor: Cintia Maas
