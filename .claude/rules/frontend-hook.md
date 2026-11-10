---
description: Frontend hook file conventions
paths:
  - "src/hooks/**/*.ts"
  - "src/features/**/hooks/**/*.ts"
---

# Frontend Hook Files

Hooks are thin wrappers around services using TanStack Query.

## Use `AxiosError` for error type — not `Error`

All mutations and queries use axios under the hood. Use `AxiosError` so `error.response?.status` and `error.response?.data` are properly typed.

```typescript
// WRONG — error.response is untyped
useMutation<LoginResponse, Error, LoginDto>({ ... });

// CORRECT — error.response?.status works without casting
import type { AxiosError } from 'axios';
useMutation<LoginResponse, AxiosError, LoginDto>({ ... });
```

## Use `export function`, not `export const`

```typescript
// WRONG
export const useLogin = (options?: UseLoginOptions) => {
  return useMutation<LoginResponse, AxiosError, LoginDto>({ ... });
};

// CORRECT
export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponse, AxiosError, LoginDto>({ ... });
}
```

## Use direct function references for mutationFn/queryFn

When the service function signature matches what TanStack Query expects, pass it directly.

```typescript
// WRONG — redundant wrapper
mutationFn: (data: LoginDto) => login(data),
queryFn: () => getProfile(),

// CORRECT — direct reference
mutationFn: login,
queryFn: getProfile,
```

Exception: destructuring params or multi-step async logic:
```typescript
mutationFn: ({ email, otp }) => verifyResetOtp(email, otp),

mutationFn: async (sessionId) => {
  const { options } = await startPasskeyVerification(sessionId);
  const credential = await startAuthentication({ optionsJSON: options });
  return await verifyPasskeyMfa(sessionId, credential);
},
```

## Options type pattern

```typescript
type UseLoginOptions = Omit<UseMutationOptions<LoginResponse, AxiosError, LoginDto>, 'mutationFn'>;
```

## Query keys — hierarchical arrays

```typescript
['auth', 'user']
['profile']
['sessions']
['mobile-verification', 'status']
['conversations']
```

## Table hooks — keep previous rows while refetching

A DataTable hook refetches on every filter / context / sort change, so it keeps the previous page on screen instead of
flashing the skeleton:

```typescript
return useQuery<OfferingsTableResponse, AxiosError>({
  queryKey: OFFERINGS_TABLE_KEY,
  queryFn: getOfferingsTable,
  placeholderData: keepPreviousData,
});
```

The page passes the whole query to `useDataTable({ query })`, which carries `isLoading` (first load → skeleton) and
`isFetching` (thin progress bar over the kept rows) through to `<DataTable table={…}>`; `onStatePush` returns the invalidation promise (`() => queryClient.invalidateQueries(...)`) so the
skeleton holds until a default-filled refetch lands. Context and filters travel in the saved table state — the hook
takes no context arguments and its query key carries none.

A table whose slug carries a record id (`commerce-le-inventory-item-${id}-prices`) must not keep another record's
rows: the response carries that record's saved `state`, and `useDataTable` would load it into the new slug. Keep the
previous data only for the same record:

```typescript
placeholderData: (previous, previousQuery) =>
  previousQuery?.queryKey[ITEM_ID_INDEX] === itemId ? previous : undefined,
```

## Constants as `export const`

```typescript
export const PROFILE_QUERY_KEY = ['profile'] as const;
export const SESSIONS_QUERY_KEY = ['sessions'] as const;
```

## File structure — domain folders with barrel exports

Organize hooks by domain in folders, not flat files:

```
// WRONG — flat
hooks/
├── useUom.ts
├── useCreateUom.ts
├── useUpdateUom.ts
└── useDeleteUom.ts

// CORRECT — domain folder with barrel export
hooks/
└── uom/
    ├── index.ts           ← barrel re-exports all hooks + query keys
    ├── useUom.ts
    ├── useCreateUom.ts
    ├── useUpdateUom.ts
    └── useDeleteUom.ts
```

Consumers import from the barrel: `import { useBaseUnits, useCreateUom } from '@/hooks/uom'`

## Types — import from schemas, not services

Hook mutation types come from `@/schemas/*`, not from service files:

```typescript
// WRONG — importing payload type from service
import { type CreateUomPayload, createUom } from '@/services/uom.service';

// CORRECT — types from schema, function from service
import type { CreateUomData } from '@/schemas/uom';
import { createUom } from '@/services/uom.service';
```
