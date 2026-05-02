# Contributing

## Objetivo

Este projeto aceita contribuicoes focadas em qualidade de codigo, estabilidade, UX e manutencao do fluxo financeiro local.

## Antes de Abrir PR

1. Abra uma issue quando a mudanca for grande.
2. Evite alterar persistencia, schema ou regras financeiras sem explicar impacto.
3. Nao misture refatoracao ampla com correcao de bug sem necessidade.

## Padroes

- Preserve TypeScript limpo e legivel.
- Prefira mudancas pequenas e objetivas.
- Nao introduza dependencia nova sem justificativa.
- Mantenha compatibilidade com Android, iOS e Web quando aplicavel.
- Nao adicione texto visivel direto em telas/componentes; inclua em `locales/translations.ts` e consuma com `useI18n`.
- Nao use `toLocaleString('pt-BR')` em UI; use os formatadores de `useI18n`.

## Checklist de PR

- descricao curta do problema
- resumo objetivo da solucao
- riscos conhecidos
- passos de validacao manual
- validacao de textos nos idiomas `pt-BR`, `en` e `es` quando houver mudanca de UI
- `npm run lint`
- `npm run typecheck`
- `npm run web:export` quando tocar Web, rotas, persistencia ou layout

## Areas Sensiveis

Mudancas nestes pontos merecem cuidado extra:

- `data/`
- `domain/`
- `app/_layout.tsx`
- `data/sqlite/`

## Seguranca

Falhas de seguranca nao devem ser abertas publicamente primeiro. Consulte [SECURITY.md](./SECURITY.md).
