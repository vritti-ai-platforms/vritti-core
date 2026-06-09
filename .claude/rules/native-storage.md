---
description: core-app on-device storage split — Keychain for secrets, MMKV for non-secret preferences
paths:
  - "apps/core-app/src/**/*.{ts,tsx}"
---

# Native Storage

core-app has two storage backends with a hard split by sensitivity. Never blur them.

## Secrets → Keychain (hardware-backed)

Auth tokens, refresh tokens, and the deployment base URL go through the
**Keychain-backed adapter** (`storage`) defined in `apps/core-app/quantum-ui-native.config.ts`,
wired into `mobileAxiosConfig`. It uses `react-native-keychain` with
`ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY` (Secure Enclave / Keystore).

> WHY: MMKV's optional AES key has to live on-device, so it's strictly weaker than
> the Keychain for secrets. Tokens never go in MMKV.

## Non-secret state → MMKV (fast, synchronous)

Theme preference, cached selections (e.g. last-selected BU), feature flags, and
other non-sensitive UI state go through **MMKV**. The MMKV adapter factory lives in
the shared package (`@vritti/quantum-ui-native/utils` → `createPreferences` /
`createMmkvStorageAdapter`) so every RN app reuses it. The app owns only its
namespace + domain keys, in the single module `apps/core-app/src/host/config/storage.ts`:

```typescript
// config/storage.ts — the app's one MMKV setup
import { createPreferences } from '@vritti/quantum-ui-native/utils';
export const { instance: preferences, storage: preferencesStorage } =
  createPreferences('vritti.preferences');

// consumers import from config/storage, never react-native-mmkv:
import { preferences, preferencesStorage } from '../config/storage';
<ThemeProvider storage={preferencesStorage} />        // adapter form
preferences.set('selectedBuId', buId);                // direct instance form
const buId = preferences.getString('selectedBuId');
```

> WHY: MMKV is synchronous and ~30x faster than AsyncStorage; the factory wraps it
> into the async `getItem/setItem/deleteItem` contract with zero I/O latency. Keeping
> the factory in the package means the next RN app gets it for free.

## Rules

- **NEVER** `import … from 'react-native-mmkv'` anywhere in the app — not even in
  `config/storage.ts`. Use `createPreferences` from `@vritti/quantum-ui-native/utils`
  there, and import `preferences` / `preferencesStorage` from `config/storage`
  elsewhere. (Enforced by the `native-guard` PreToolUse hook.)
- **NEVER** put a secret (token, password, base URL) in MMKV. Secrets → Keychain.
- `react-native-mmkv` is an *optional* peer dep of the package; the app installs it and
  needs a native rebuild after install (Nitro module) — `pod install` + rebuild.
- Don't reach for `@react-native-async-storage/async-storage`; MMKV replaces it.
