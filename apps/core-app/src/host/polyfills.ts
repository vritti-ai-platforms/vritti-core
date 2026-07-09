// Hermes lacks FinalizationRegistry/WeakRef that Apollo Client v4 needs; define inert shims before Apollo is imported (no-op cleanup, strong ref — only GC-driven cache eviction is disabled).
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
