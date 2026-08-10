# travel-planner-e2e-test
Automatizar testes web do app travel-planner

## Estrutura do projeto
travel-planner-e2e/
├── tests/
│   └── e2e/
│       └── home.spec.ts
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
└── README.md

## Rodando

1. Clonar o repositório, instalar as dependências
```
npm install
```

2. Executar testes em Headless
```
npx run test:e2e
```

3. Executar ver o relatório dos testes
```
npx playwright show-report
```

<hr>
Autor: Cintia Maas