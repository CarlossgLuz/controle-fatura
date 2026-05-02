# Clarium

Aplicativo open source para controle de gastos, compras no cartao, planejamento mensal e leitura de indicadores financeiros, construido com Expo, React Native, Expo Router e persistencia local.

Site oficial: [clarium.vercel.app](https://clarium.vercel.app)

## Visao Geral

O projeto foi pensado para uso local-first:

- lancamentos de receita e gasto manual
- compras no cartao com ciclo de fatura
- metas e recorrencias mensais
- dashboard inicial e tela de insights
- suporte de interface para `pt-BR`, `en` e `es`
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
locales/              contrato e textos traduzidos da interface
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

## Download e Acesso

O app tambem esta disponivel publicamente em:

- [https://clarium.vercel.app](https://clarium.vercel.app)

## Scripts

```bash
npm run start
npm run web
npm run android
npm run ios
npm run lint
npm run typecheck
npm run web:export
```

## Funcionalidades Principais

- lancamento manual com suporte a valores em `,` e `.`
- compras com data, categoria, descricao e parcelamento
- edicao de gastos recentes
- exclusao de gastos simples, compras e parcelas futuras
- planejamento mensal com meta, configuracao de cartao e recorrencias
- insights por categoria, uso de pagamento e historico mensal

## Idioma e Formatos

Toda string visivel para usuario deve passar por `locales/translations.ts` e ser consumida com `useI18n`. O mesmo vale para moeda, percentual e data: use `formatCurrency`, `formatPercent`, `formatIsoDate` e `formatMonthLabel` em vez de `toLocaleString('pt-BR')` dentro das telas.

## Persistencia

Os dados sao armazenados localmente no dispositivo. No nativo, compras usam SQLite; no Web, o app usa uma implementacao local em `localStorage` para evitar falhas do SQLite/WASM no navegador. Isso favorece simplicidade e privacidade local, mas tambem significa que o projeto ainda exige endurecimento adicional antes de um deploy de producao mais sensivel.

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
