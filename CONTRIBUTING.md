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

## Checklist de PR

- descricao curta do problema
- resumo objetivo da solucao
- riscos conhecidos
- passos de validacao manual

## Areas Sensiveis

Mudancas nestes pontos merecem cuidado extra:

- `data/`
- `domain/`
- `app/_layout.tsx`
- `data/sqlite/`

## Seguranca

Falhas de seguranca nao devem ser abertas publicamente primeiro. Consulte [SECURITY.md](./SECURITY.md).
