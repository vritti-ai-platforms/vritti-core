# vritti-web-nexus - Development Best Practices

This document outlines the conventions and best practices for the vritti-web-nexus frontend application.

## Project Overview

vritti-web-nexus is the main host React application built with:
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **@vritti/quantum-ui** component library
- **Module Federation** for micro-frontend architecture (host application)
- **React Router** for navigation
- **TanStack Query** for server state management

## Critical Best Practices

### 1. Color Usage Guidelines

**CRITICAL: Never hardcode colors.** Always use design system tokens from quantum-ui.

Available semantic colors:
- `primary` / `primary-foreground` - Brand primary color
- `secondary` / `secondary-foreground` - Secondary actions
- `muted` / `muted-foreground` - Subtle backgrounds/text
- `accent` / `accent-foreground` - Accent highlights
- `destructive` / `destructive-foreground` - Error/danger states
- `warning` / `warning-foreground` - Warning states
- `success` / `success-foreground` - Success states
- `background` / `foreground` - Base colors
- `card` / `card-foreground` - Card surfaces
- `border`, `input`, `ring` - UI element colors

```typescript
// WRONG - Hardcoded colors
<div style={{ color: '#16a34a' }} />
<div style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }} />
<div className="text-green-600" />  // Tailwind palette colors may not match theme

// CORRECT - Design system tokens
<div className="text-success" />
<div className="bg-success/15 text-success" />
<CheckCircle className="text-success" />
```

For opacity variants, use Tailwind's opacity modifier:
```typescript
<div className="bg-success/15" />  // 15% opacity
<div className="bg-destructive/20" />  // 20% opacity
```

For SVG icons that need dynamic fill colors, use CSS variables:
```typescript
// For custom SVG icons
<path style={{ fill: 'var(--color-foreground)' }} />
```

### 2. Spacing and Sizing Guidelines

**CRITICAL: Only use standard Tailwind spacing classes. Never use pixel values or custom rem values.**

This ensures:
- **Accessibility**: Respects user's browser font size preferences
- **Responsive design**: Scales properly across devices
- **Consistency**: Follows design system spacing
- **Maintainability**: Easier to adjust global spacing

```typescript
// WRONG - Pixel values
<div className="pt-[66px] px-[30px] py-[10px]" />
<div style={{ padding: '20px', margin: '16px' }} />

// WRONG - Custom rem values in brackets
<div className="pt-[4.125rem] px-[1.875rem]" />

// CORRECT - Standard Tailwind spacing classes
<div className="pt-16 px-8 py-2.5" />
<div className="p-6 m-4" />
```

**Tailwind spacing scale reference:**
- `0.5` = 0.125rem = 2px
- `1` = 0.25rem = 4px
- `2` = 0.5rem = 8px
- `2.5` = 0.625rem = 10px
- `4` = 1rem = 16px
- `6` = 1.5rem = 24px
- `8` = 2rem = 32px
- `10` = 2.5rem = 40px
- `12` = 3rem = 48px
- `16` = 4rem = 64px
- `20` = 5rem = 80px
- `24` = 6rem = 96px

**DO**:
- ✅ Use standard Tailwind spacing classes (p-4, m-6, gap-8, pt-16)
- ✅ Use percentage for widths/flex values (w-1/2, flex-1)
- ✅ Use viewport units for full-screen layouts (h-screen, min-h-screen)
- ✅ Choose the closest standard Tailwind class instead of custom values

**DON'T**:
- ❌ Use px units in className or style attributes
- ❌ Use custom rem values in brackets like pt-[4.125rem]
- ❌ Use absolute pixel measurements
- ❌ Create arbitrary values when a standard class exists

### 3. Component Imports

Always import quantum-ui components from their specific paths:
```typescript
// CORRECT
import { Button } from '@vritti/quantum-ui/Button';
import { Typography } from '@vritti/quantum-ui/Typography';

// WRONG - Don't use barrel imports
import { Button, Typography } from '@vritti/quantum-ui';
```

### 3. Styling Guidelines

- Use Tailwind CSS v4 utility classes
- Import `cn` utility from quantum-ui for class merging
- Follow the design token system
- Support dark mode automatically via design tokens
- Use quantum-ui components whenever possible

### 4. Environment Variables

**CRITICAL: Rsbuild uses `PUBLIC_` prefix for client-side environment variables.**

Environment variables are exposed via `import.meta.env` (NOT `process.env` which is for Node.js):
- Variables MUST have `PUBLIC_` prefix to be accessible in browser code
- Type declarations go in `src/env.d.ts` via `ImportMetaEnv` interface
- Use type-safe access pattern with `getEnvVar()` helper for dynamic key access

Available environment variables:
- `PUBLIC_AUTH_MF_PORT` - Auth microfrontend port (local dev, e.g., '3001')
- `PUBLIC_VRITTI_CLOUD_PORT` - Cloud microfrontend port (local dev, e.g., '3002')
- `PUBLIC_MF_BASE_URL` - Module Federation base URL (production, e.g., 'https://mf.vrittiai.com')

**Type declarations** (`src/env.d.ts`):
```typescript
interface ImportMetaEnv {
  // Module Federation remote ports (local development)
  readonly PUBLIC_AUTH_MF_PORT?: string;
  readonly PUBLIC_VRITTI_CLOUD_PORT?: string;

  // Module Federation base URL (production)
  readonly PUBLIC_MF_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

**Type-safe dynamic access** (`src/config/remotes.config.ts`):
```typescript
// Rsbuild's import.meta.env doesn't support dynamic key access by default
const getEnvVar = (key: string): string | undefined => {
  return (import.meta.env as Record<string, string | undefined>)[key];
};

// Usage
const remotePort = getEnvVar('PUBLIC_AUTH_MF_PORT');
```

### 5. Module Federation Configuration

As the host application:
- Remote micro-frontends are loaded dynamically
- Shared dependencies are configured in `rsbuild.config.ts`
- Auth module is loaded from `vritti-auth`

**Configuration Best Practices**:

1. **Never hardcode protocols or hosts** - Use environment-driven configuration
2. **Dynamic protocol detection** - Auto-detect HTTP/HTTPS from `window.location.protocol`
3. **Environment-based routing**:
   - **Local mode**: Port-based routing when `PUBLIC_*_PORT` env vars are defined
   - **Production mode**: Path-based routing when `PUBLIC_MF_BASE_URL` is defined
4. **SSR-safe fallbacks** - Handle `window` being undefined during build

**Environment detection** (`src/config/remotes.config.ts`):
```typescript
const getEnvironmentConfig = (): EnvironmentConfig => {
  // SSR/build time fallback
  if (typeof window === 'undefined') {
    return {
      isLocal: true,
      protocol: 'http',
      host: 'local.vrittiai.com',
      port: '3012',
    };
  }

  const { protocol, hostname, port } = window.location;

  // Detect local environment by hostname pattern
  const isLocal = hostname.includes('local.vrittiai.com');

  return {
    isLocal,
    protocol: protocol.replace(':', ''), // 'http' or 'https'
    host: hostname,
    port: port || (protocol === 'https:' ? '443' : '80'),
  };
};
```

**Building remote URLs** (`src/config/remotes.config.ts`):
```typescript
const buildRemoteEntry = (config: {
  portEnvVar: string;    // e.g., 'PUBLIC_AUTH_MF_PORT'
  prodPath: string;      // e.g., 'auth-microfrontend'
}): string => {
  const { protocol, host } = getEnvironmentConfig();

  // Check if port environment variable is defined
  const remotePort = getEnvVar(config.portEnvVar);

  if (remotePort) {
    // Local: port-based routing
    // Example: http://local.vrittiai.com:3001/mf-manifest.json
    return `${protocol}://${host}:${remotePort}/mf-manifest.json`;
  } else {
    // Production: path-based routing with MF_BASE_URL
    // Example: https://mf.vrittiai.com/auth-microfrontend/mf-manifest.json
    const mfBaseUrl = import.meta.env.PUBLIC_MF_BASE_URL || `${protocol}://${host}`;
    return `${mfBaseUrl}/${config.prodPath}/mf-manifest.json`;
  }
};

// Usage in ALL_REMOTES array
export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'VrittiAuth',
    entry: buildRemoteEntry({
      portEnvVar: 'PUBLIC_AUTH_MF_PORT',
      prodPath: 'auth-microfrontend',
    }),
    exposedModule: 'routes',
  },
];
```

**DO**:
- ✅ Use `getEnvironmentConfig()` to detect protocol dynamically
- ✅ Use `getEnvVar()` for type-safe environment variable access
- ✅ Separate local and production URL logic with environment variables
- ✅ Provide SSR-safe fallbacks for `window` access

**DON'T**:
- ❌ Hardcode `http://` or `https://` in remote URLs
- ❌ Use `process.env` (that's for Node.js, not browser)
- ❌ Access `import.meta.env['KEY']` directly without type casting
- ❌ Forget `PUBLIC_` prefix on environment variables

### 6. Form Handling

- Use `react-hook-form` with `zod` schemas for validation
- Use quantum-ui Form components (`Form`, `Field`, `FieldGroup`, etc.)
- Mutations should use TanStack Query hooks

### 7. Services and Hooks Pattern

**CRITICAL: Follow established patterns for API calls and React Query integration.**

This project uses a clear separation between services (API calls) and hooks (React Query wrappers).

#### Services (`src/services/`)

Services contain pure API call functions using axios from `@vritti/quantum-ui/axios`:

```typescript
// src/services/user.service.ts
import axios, { type AxiosResponse } from '@vritti/quantum-ui/axios';

/**
 * User data response from the /auth/me endpoint
 */
export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  roles: string[];
  permissions: string[];
}

/**
 * Fetches the currently authenticated user's data
 */
export async function getCurrentUser(): Promise<User> {
  const response: AxiosResponse<User> = await axios.get('cloud-api/auth/me');
  return response.data;
}

/**
 * Logs out the current user from the current device
 */
export async function logout(): Promise<void> {
  await axios.post('cloud-api/auth/logout', {}, {
    successMessage: 'Logged out successfully',
  });
}
```

**Centralized exports** (`src/services/index.ts`):
```typescript
// User services
export type { User } from './user.service';
export { getCurrentUser, logout, logoutAll } from './user.service';
```

**Service Best Practices**:
- ✅ One service file per domain (user.service.ts, auth.service.ts)
- ✅ Comprehensive JSDoc with examples
- ✅ Type-safe with interfaces for DTOs and responses
- ✅ Use `type` keyword for type-only imports
- ✅ Export types and functions from index.ts
- ✅ Use axios config options (successMessage, loadingMessage, public)
- ❌ Don't include React Query logic in services
- ❌ Don't handle component state in services

#### Hooks (`src/hooks/`)

Hooks wrap services with TanStack Query for React integration:

**Pattern 1: Query Hook** (for data fetching):
```typescript
// src/hooks/useUser.ts
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getToken } from '@vritti/quantum-ui/axios';
import { getCurrentUser, type User } from '../services';

type UseUserOptions = Omit<
  UseQueryOptions<User, Error>,
  'queryKey' | 'queryFn' | 'enabled'
>;

export const useUser = (options?: UseUserOptions) => {
  const isAuthenticated = !!getToken();

  return useQuery<User, Error>({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    enabled: isAuthenticated, // Only fetch if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    ...options,
  });
};
```

**Pattern 2: Mutation Hook** (for actions):
```typescript
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { logout } from '../services';

type UseLogoutOptions = Omit<
  UseMutationOptions<void, Error, void>,
  'mutationFn'
>;

export const useLogout = (options?: UseLogoutOptions) => {
  return useMutation<void, Error, void>({
    mutationFn: logout,
    ...options,
  });
};
```

**Pattern 3: Mutation with Parameters**:
```typescript
interface VerifyEmailParams {
  otp: string;
}

type UseVerifyEmailOptions = Omit<
  UseMutationOptions<void, Error, VerifyEmailParams>,
  'mutationFn'
>;

export const useVerifyEmail = (options?: UseVerifyEmailOptions) => {
  return useMutation<void, Error, VerifyEmailParams>({
    mutationFn: ({ otp }) => verifyEmail(otp),
    ...options,
  });
};

// Usage
const verifyMutation = useVerifyEmail({
  onSuccess: () => console.log('Verified!'),
});
verifyMutation.mutate({ otp: '123456' });
```

**Centralized exports** (`src/hooks/index.ts`):
```typescript
// User hooks
export { useUser, useLogout, useLogoutAll } from './useUser';
```

**Hook Best Practices**:
- ✅ Use `useQuery` for data fetching
- ✅ Use `useMutation` for actions (POST, PUT, DELETE)
- ✅ Use `type` keyword for type-only imports
- ✅ Use `Omit<UseMutationOptions, 'mutationFn'>` for type-safe options
- ✅ Include comprehensive JSDoc with examples
- ✅ Export hooks from index.ts using relative imports
- ✅ Allow consumers to pass onSuccess, onError callbacks via options
- ❌ Don't include business logic in hooks (put it in services)
- ❌ Don't hardcode queryKey strings (use descriptive arrays)
- ❌ Don't use path aliases like '@/' - use relative imports instead

**Query Key Patterns**:
```typescript
// Hierarchical structure
['auth', 'user']              // User profile
['auth', 'user', userId]      // Specific user
['onboarding', 'status']      // Onboarding status
['mobile-verification', 'status']  // Mobile verification
```

**Usage in Components**:
```typescript
import { useUser, useLogout } from '../hooks';
import { clearToken } from '@vritti/quantum-ui/axios';

function UserMenu() {
  const { data: user, isLoading } = useUser();
  const logoutMutation = useLogout({
    onSuccess: () => {
      clearToken();
      window.location.href = '/auth/login';
    },
  });

  if (isLoading) return <Skeleton />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {user?.firstName} {user?.lastName}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Common Patterns

### Icon Colors in Light/Dark Mode

For custom SVG icons that need to adapt to theme:
```typescript
export const MyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path style={{ fill: 'var(--color-foreground)' }} d="..." />
  </svg>
);
```

### Success/Error States

```typescript
// Success state
<div className="bg-success/15 text-success rounded-lg p-4">
  <CheckCircle className="h-5 w-5 text-success" />
  <span>Operation successful</span>
</div>

// Error state
<div className="bg-destructive/15 text-destructive rounded-lg p-4">
  <AlertCircle className="h-5 w-5 text-destructive" />
  <span>An error occurred</span>
</div>
```

## Starting the Application

**Prerequisites**:
- `vritti-auth` must be running on port 3001 (or the port specified in `PUBLIC_AUTH_MF_PORT`)
- If using HTTPS mode, SSL certificates must be in `./certs/` directory

**Available npm scripts**:
```bash
# HTTP mode (default)
pnpm dev                    # Starts on http://local.vrittiai.com:3012

# HTTPS mode
pnpm dev:ssl                # Starts on https://local.vrittiai.com:3012

# With cloud microfrontend
pnpm dev:cloud              # HTTP mode with cloud remote
pnpm dev:ssl:cloud          # HTTPS mode with cloud remote
```

**Access URLs**:
- **HTTP**: `http://local.vrittiai.com:3012`
- **HTTPS**: `https://local.vrittiai.com:3012`

**Important Notes**:
- Protocol (HTTP/HTTPS) is auto-detected from `window.location.protocol`
- Remote microfrontends MUST run on the same protocol as the host
- If host runs on HTTPS, all remotes must also run on HTTPS
- Port conflicts will prevent the application from starting

## Convention Rules

See `.claude/rules/` for detailed pattern documentation:
- `frontend-conventions.md` — Component patterns, Tailwind v4, quantum-ui usage
- `frontend-file-structure.md` — File/folder organization
- `frontend-hook.md` — TanStack Query hook conventions
- `frontend-service.md` — Axios service conventions
- `comment-style.md` — Comment style rules
- `export-conventions.md` — Export patterns
