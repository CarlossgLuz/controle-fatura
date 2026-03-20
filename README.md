# Clarium

Aplicativo open source para controle de gastos, compras no cartao, planejamento mensal e leitura de indicadores financeiros, construido com Expo, React Native, Expo Router e persistencia local.

## Visao Geral

O projeto foi pensado para uso local-first:

- lancamentos de receita e gasto manual
- compras no cartao com ciclo de fatura
- metas e recorrencias mensais
- dashboard inicial e tela de insights
- persistencia local com `expo-sqlite` e `expo-sqlite/kv-store`

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- SQLite local

## Estrutura

```text
app/                  rotas e telas
components/           componentes reutilizaveis
constants/            tema e tokens
data/                 persistencia local e agregacoes
domain/               regras de negocio
hooks/                hooks de UI e preferencias
providers/            providers globais
utils/                utilitarios
```

## Como Rodar

### Requisitos

- Node.js 20+
- npm 10+

### Instalar dependencias

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npx expo start
```

Atalhos comuns:

- `npm run web`
- `npm run android`
- `npm run ios`

## Scripts

```bash
npm run start
npm run web
npm run android
npm run ios
npm run lint
```

## Funcionalidades Principais

- lancamento manual com suporte a valores em `,` e `.`
- compras com data, categoria, descricao e parcelamento
- edicao de gastos recentes
- exclusao de gastos simples, compras e parcelas futuras
- planejamento mensal com meta, configuracao de cartao e recorrencias
- insights por categoria, uso de pagamento e historico mensal

## Persistencia

Os dados sao armazenados localmente no dispositivo. Isso favorece simplicidade e privacidade local, mas tambem significa que o projeto ainda exige endurecimento adicional antes de um deploy de producao mais sensivel.

## Open Source

Este repositorio e distribuido sob a licenca MIT. Consulte:

- [LICENSE](./LICENSE)
- [NOTICE](./NOTICE)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SECURITY.md](./SECURITY.md)

## Contribuicao

Issues e pull requests sao bem-vindos. Antes de contribuir, leia [CONTRIBUTING.md](./CONTRIBUTING.md).

## Seguranca

Para reporte responsavel de falhas, consulte [SECURITY.md](./SECURITY.md).
