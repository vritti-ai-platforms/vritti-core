// Apollo Client v4 references `FinalizationRegistry` and `WeakRef` for internal cache memory
// management. Hermes (React Native) does not expose `FinalizationRegistry`, so importing
// `@apollo/client` throws `ReferenceError: Property 'FinalizationRegistry' doesn't exist` and the
// module fails to load — cascading into the lazy/bootstrap chain. Define minimal globals BEFORE
// Apollo is ever imported.
//
// The no-op `FinalizationRegistry` never fires its cleanup callback, and the `WeakRef` shim holds a
// STRONG reference — Apollo stays fully functional; only its GC-driven cache-eviction optimization
// is inert. This module MUST be imported before `@apollo/client` (kept near the top of the entry).
const globalScope = globalThis as unknown as Record<string, unknown>;

if (typeof globalScope.FinalizationRegistry === 'undefined') {
  class FinalizationRegistryPolyfill {
    register(): void {}
    unregister(): boolean {
      return false;
    }
  }
  globalScope.FinalizationRegistry = FinalizationRegistryPolyfill;
}

if (typeof globalScope.WeakRef === 'undefined') {
  class WeakRefPolyfill<T extends object> {
    private readonly target: T;

    constructor(target: T) {
      this.target = target;
    }

    deref(): T | undefined {
      return this.target;
    }
  }
  globalScope.WeakRef = WeakRefPolyfill;
}
