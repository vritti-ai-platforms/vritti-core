import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The tier boundary, enforced at build time.
 *
 * `core/` runs in Node, a browser and React Native alike; `native/` runs on a device. None may reach
 * for a Node builtin, a database driver, a server framework, or a higher tier.
 *
 * `next/checkout.ts` and the gateway plugins under `checkout/` are held to the browser's rules on top: client
 * components import them, so one server-only import there breaks every storefront's client bundle.
 *
 * This runs in `build` rather than as a test because one such import does not fail this package —
 * it fails at Metro bundle time in an app that consumed it, a long way from the edit that caused it.
 * A folder boundary nothing checks is one that rots.
 */
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const TIERS = ['core', 'native', 'checkout'];

const FORBIDDEN = [
  [/from '(node:[^']+)'/g, 'a Node builtin'],
  [/from '(pg)'/g, 'the Postgres driver'],
  [/from '(payload[^']*)'/g, 'Payload'],
  [/from '(react(-dom)?)'/g, 'React'],
  [/from '[^']*\.\.\/(server|payload)\//g, 'a higher tier'],
];

function tsFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return tsFiles(full);
    return entry.endsWith('.ts') ? [full] : [];
  });
}

const offences = [];
for (const tier of TIERS) {
  for (const file of tsFiles(join(SRC, tier))) {
    // Generated against core's schema; it imports nothing but graphql.
    if (file.includes(`${tier}/gql/`)) continue;
    const source = readFileSync(file, 'utf8');
    for (const [pattern, why] of FORBIDDEN) {
      for (const match of source.matchAll(pattern)) {
        offences.push(`  ${file.slice(SRC.length + 1)} imports ${why} — ${match[0]}`);
      }
    }
  }
}

// Imported by client components: anything server-only here lands in the browser bundle
const CLIENT_FILES = ['next/checkout.ts'];
const CLIENT_FORBIDDEN = [
  ...FORBIDDEN,
  [/from '(next\/(headers|cache|navigation))'/g, 'a server-only Next module'],
  [/from '(@vritti\/vap-sdk\/(payload|server|next\/[a-z-]+))'/g, 'a server tier of this package'],
  [/from '\.\/(?!checkout)[^']*'/g, 'a sibling server module'],
  [/^'use server'/gm, "the 'use server' directive"],
];
// The plugins import each other and the core types, but never a server tier or a Next server module
const PLUGIN_FILES = tsFiles(join(SRC, 'checkout')).map((file) => file.slice(SRC.length + 1));
const PLUGIN_FORBIDDEN = [
  ...FORBIDDEN,
  [/from '(next\/[^']+)'/g, 'a Next module'],
  [/from '(@vritti\/vap-sdk\/(payload|server|next\/[a-z-]+))'/g, 'a server tier of this package'],
  [/from '\.\.\/(next|server|payload|native)\//g, 'a server or native tier'],
  [/^'use (server|client)'/gm, 'a framework directive'],
];
for (const relative of PLUGIN_FILES) {
  const source = readFileSync(join(SRC, relative), 'utf8');
  for (const [pattern, why] of PLUGIN_FORBIDDEN) {
    for (const match of source.matchAll(pattern)) {
      offences.push(`  ${relative} imports ${why} — ${match[0]}`);
    }
  }
}

for (const relative of CLIENT_FILES) {
  const source = readFileSync(join(SRC, relative), 'utf8');
  for (const [pattern, why] of CLIENT_FORBIDDEN) {
    for (const match of source.matchAll(pattern)) {
      offences.push(`  ${relative} imports ${why} — ${match[0]}`);
    }
  }
}

if (offences.length > 0) {
  console.error(
    `\nTier violation: ${TIERS.join('/')} and ${CLIENT_FILES.join(', ')} must stay environment-free.\n${offences.join('\n')}\n`,
  );
  process.exit(1);
}
