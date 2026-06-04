---
description: Service file conventions for core-app React Native
paths:
  - "apps/core-app/src/host/services/**/*.ts"
---

# Native Service Files

Services are pure functions wrapping axios calls. No React, no hooks, no state.

## No async/await — return promise chain directly

```typescript
// WRONG
export async function login(data: LoginDto): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>('auth/mobile/login', data, { public: true });
  return response.data;
}

// CORRECT
export function login(data: LoginDto): Promise<LoginResponse> {
  return axios.post<LoginResponse>('auth/mobile/login', data, { public: true }).then((r) => r.data);
}
```

For void returns, use `.then(() => undefined)`.

## Import axios from @vritti/quantum-ui-native/utils

```typescript
// WRONG
import axios from 'axios';

// CORRECT
import { axios } from '@vritti/quantum-ui-native/utils';
```

## export function — never export const

```typescript
// WRONG
export const login = (data: LoginDto): Promise<LoginResponse> => { ... }

// CORRECT
export function login(data: LoginDto): Promise<LoginResponse> { ... }
```

## Unauthenticated endpoints — pass { public: true }

```typescript
export function login(data: LoginDto): Promise<LoginResponse> {
  return axios.post<LoginResponse>('auth/mobile/login', data, { public: true }).then((r) => r.data);
}
```

Omit `{ public: true }` on all authenticated endpoints — the interceptor attaches the token automatically.

## Types — define in types/, import in services

Never define inline interfaces inside service files.

```typescript
// WRONG
export interface LoginPayload { email: string; password: string; }
export function login(data: LoginPayload): Promise<LoginResponse> { ... }

// CORRECT
import type { LoginDto, LoginResponse } from '../../types/auth';
export function login(data: LoginDto): Promise<LoginResponse> { ... }
```

## File location and naming

```
src/host/services/
├── auth/
│   ├── auth.service.ts       ← login, logout, lookupOrganizations
│   └── deployment.service.ts ← getDeployments, buildOrganizationApiBaseURL
└── account/
    └── security.service.ts   ← changePassword, getSessions, revokeSession
```

One service file per feature area. Name: `<feature>.service.ts`.
