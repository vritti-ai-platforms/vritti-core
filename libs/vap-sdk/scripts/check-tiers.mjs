import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The tier boundary, enforced at build time.
 *
 * `core/` runs in Node, a browser and React Native alike; `native/` runs on a device. Neither may
 * reach for a Node builtin, a database driver, a server framework, or a higher tier.
 *
 * This runs in `build` rather than as a test because one such import does not fail this package —
 * it fails at Metro bundle time in an app that consumed it, a long way from the edit that caused it.
 * A folder boundary nothing checks is one that rots.
 */
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const TIERS = ['core', 'native'];

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

if (offences.length > 0) {
  console.error(`\nTier violation: ${TIERS.join('/')} must stay environment-free.\n${offences.join('\n')}\n`);
  process.exit(1);
}
