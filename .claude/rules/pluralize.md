# Pluralization

Never hand-roll plural suffixes with a ternary. Use `pluralize` from `@vritti/quantum-ui/pluralize` —
it handles irregular plurals (`entity`→`entities`, `person`→`people`) and reads far more clearly than
`${n === 1 ? '' : 's'}`.

```ts
import { pluralize } from '@vritti/quantum-ui/pluralize';
```

Signature: `pluralize(word, count?, inclusive?)`.

## Inclusive — count + noun rendered together (the common case)

Pass `count` **and** `true` to prepend the number:

```tsx
// WRONG
`${n} service${n === 1 ? '' : 's'}`
{count} backup{count === 1 ? '' : 's'}
`${n} ${n === 1 ? 'feature' : 'features'}`

// CORRECT
pluralize('service', n, true)        // "1 service" / "2 services"
{pluralize('backup', count, true)}
pluralize('feature', n, true)
```

## Non-inclusive — noun only (count shown separately)

Omit the third arg when the number is rendered on its own (a ratio, a prefix, a badge):

```tsx
// WRONG
`${unlocked}/${total} feature${total === 1 ? '' : 's'} unlocked`
`${n} selected ${n === 1 ? 'feature' : 'features'}`

// CORRECT
`${unlocked}/${total} ${pluralize('feature', total)} unlocked`
`${n} selected ${pluralize('feature', n)}`
```

## Rules

- **Forbidden:** `? '' : 's'`, `? 's' : ''`, `=== 1 ? 'x' : 'xs'`, `!== 1 ? 's' : ''`, and any inline
  suffix/word ternary keyed off a count.
- **Inclusive** (`pluralize(word, n, true)`) when the count immediately precedes the noun.
- **Non-inclusive** (`pluralize(word, n)`) when the count is shown elsewhere (ratios like `3/5`, prefixes).
- **Irregulars just work** — `pluralize('entity', 2)` → `entities`, `pluralize('person', 2)` → `people`.
- Also replace **hard-coded plural labels** that ignore the count (e.g. `${n} permissions`, which prints
  "1 permissions") with `pluralize('permission', n, true)`.
