---
description: Hook file conventions for core-app React Native
paths:
  - "apps/core-app/src/host/hooks/**/*.ts"
---

# Native Hook Files

Hooks are thin TanStack Query wrappers around services.

## Use AxiosError — not Error

```typescript
// WRONG
useMutation<LoginResponse, Error, LoginDto>({ ... });

// CORRECT
import type { AxiosError } from 'axios';
useMutation<LoginResponse, AxiosError, LoginDto>({ ... });
```

## export function — never export const

```typescript
// WRONG
export const useLogin = (options?: UseLoginOptions) => { ... }

// CORRECT
export function useLogin(options?: UseLoginOptions) { ... }
```

## Direct mutationFn/queryFn reference

Pass the service function directly when the signature matches.

```typescript
// WRONG — redundant wrapper
mutationFn: (data: LoginDto) => login(data),
queryFn: () => getSessions(),

// CORRECT — direct reference
mutationFn: login,
queryFn: getSessions,
```

Exception: when destructuring params or chaining async steps:
```typescript
mutationFn: async (sessionId) => {
  await revokeSession(sessionId);
  queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
},
```

## Options type — Omit mutationFn/queryFn

```typescript
type UseLoginOptions = Omit<UseMutationOptions<LoginResponse, AxiosError, LoginDto>, 'mutationFn'>;

export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponse, AxiosError, LoginDto>({
    mutationFn: login,
    ...options,
  });
}
```

## Query keys — exported constants

```typescript
export const SESSIONS_QUERY_KEY = ['account', 'sessions'] as const;
export const PROFILE_QUERY_KEY = ['account', 'profile'] as const;
```

Use hierarchical arrays: `['domain', 'resource']`.

## File structure — domain folders with barrel

```
hooks/
├── auth/
│   ├── index.ts           ← barrel re-exports all hooks
│   ├── useLogin.ts
│   ├── useLogout.ts
│   ├── useLookupOrganizations.ts
│   └── useDeployments.ts
└── account/
    ├── index.ts
    ├── useChangePassword.ts
    ├── useSessions.ts
    ├── useRevokeSession.ts
    └── useRevokeAllSessions.ts
```

Consumers import from the barrel: `import { useLogin } from '../../hooks/auth'`
