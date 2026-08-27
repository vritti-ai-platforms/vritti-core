import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the surface split (see .claude/rules/gateway-conventions.md).
 *
 * Deliberately static — it reads the module files rather than importing them. Importing the real
 * Nest modules pulls the whole graph, including api-sdk's ESM-only `dinero.js`, which jest cannot
 * parse; a guard that breaks whenever an unrelated dependency changes shape is not a guard.
 */

const MODULES_DIR = join(__dirname);

const APP_SURFACE_MODULES = [
  'commerce-app-gateway.module.ts',
  'structure-app-api.module.ts',
  'communications-app-gateway.module.ts',
];

// Anything named like an app surface must be listed above, or the closure check silently skips it
const APP_SURFACE_NAME = /-app-(gateway|api)\.module\.ts$/;

function allModuleFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...allModuleFiles(full));
    else if (entry.endsWith('.module.ts')) out.push(full);
  }
  return out;
}

// The `providers: [...]` array as written, which is what Nest reads to build the schema
function providersOf(source: string): string[] {
  const match = source.match(/providers:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((entry) => entry.replace(/\/\/.*$/gm, '').trim())
    .filter((entry) => /^[A-Za-z][A-Za-z0-9]*$/.test(entry));
}

function importsOf(source: string): string[] {
  const match = source.match(/imports:\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((entry) => entry.replace(/\/\/.*$/gm, '').trim())
    .filter((entry) => /^[A-Za-z][A-Za-z0-9]*$/.test(entry));
}

// GraphQL resolvers end in `Resolver`. *RequestResolver are security services, never in a schema.
const isGraphqlResolver = (name: string) => name.endsWith('Resolver') && !name.endsWith('RequestResolver');

describe('GraphQL surfaces', () => {
  const files = allModuleFiles(MODULES_DIR);
  const byFile = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

  /**
   * THE failure this exists for: a resolver left declared in both its feature module and a surface
   * module lands in BOTH schemas. Nothing else catches it — it compiles, both endpoints serve it,
   * and with introspection enabled in production on /graphql it publishes internal operations.
   */
  it('declares every resolver in exactly one module', () => {
    const owners = new Map<string, string[]>();
    for (const [file, source] of byFile) {
      for (const provider of providersOf(source)) {
        if (!isGraphqlResolver(provider)) continue;
        owners.set(provider, [...(owners.get(provider) ?? []), file.replace(`${MODULES_DIR}/`, '')]);
      }
    }
    const duplicated = [...owners].filter(([, where]) => where.length > 1);
    expect(duplicated).toEqual([]);
  });

  /**
   * `include` walks imports transitively, so an app-surface module importing anything that declares
   * a resolver would drag that resolver into the storefront schema. Services and domain modules are
   * resolver-free and therefore safe; another surface module is not.
   */
  it('keeps the app-surface import closures free of other resolvers', () => {
    const declaresResolver = new Map<string, boolean>();
    for (const source of byFile.values()) {
      const cls = source.match(/export class (\w+Module)/)?.[1];
      if (cls) declaresResolver.set(cls, providersOf(source).some(isGraphqlResolver));
    }

    const offenders: string[] = [];
    for (const [file, source] of byFile) {
      if (!APP_SURFACE_MODULES.some((name) => file.endsWith(name))) continue;
      for (const imported of importsOf(source)) {
        if (declaresResolver.get(imported))
          offenders.push(`${file.replace(`${MODULES_DIR}/`, '')} imports ${imported}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('finds the app-surface modules it claims to check', () => {
    for (const name of APP_SURFACE_MODULES) {
      expect(files.some((f) => f.endsWith(name))).toBe(true);
    }
  });

  /**
   * Without this, adding a surface module and forgetting to list it above makes the closure check
   * pass by never looking at it — the guard reports green on exactly the case it exists to catch.
   */
  it('checks every module that looks like an app surface', () => {
    const unlisted = files
      .filter((f) => APP_SURFACE_NAME.test(f))
      .filter((f) => !APP_SURFACE_MODULES.some((name) => f.endsWith(name)))
      .map((f) => f.replace(`${MODULES_DIR}/`, ''));
    expect(unlisted).toEqual([]);
  });
});
