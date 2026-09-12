#!/usr/bin/env node
// Removes node_modules symlinks that escape this repo — the leftovers pnpm does not prune when a
// `link:` override is switched off. A stale link shadows the hoisted registry copy, and because
// TypeScript follows symlinks to their real path it drags the linked repo's own dependencies into
// the program: two copies of fastify, so `declare module 'fastify'` augmentations land on different
// module identities and `request.auth.organizationId` stops resolving.
//
// Links that a CURRENTLY ACTIVE `link:` override declares are kept — only orphans are removed.
// Workspace libs (libs/*) point inside the repo, so they never match.
//
// Usage: node scripts/clear-symlinks.mjs [--dry]
import { readdirSync, readFileSync, realpathSync, unlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry');

// Package names an uncommented `link:` override still declares — these links are intentional
function activeLinkOverrides() {
  const names = new Set();
  for (const file of ['pnpm-workspace.yaml', 'package.json']) {
    let raw;
    try {
      raw = readFileSync(join(repoRoot, file), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n')) {
      // A commented override is inactive, so its link is an orphan like any other
      if (/^\s*#/.test(line) || !line.includes('link:')) continue;
      const match = line.match(/['"]?(@?[\w./-]+)['"]?\s*:\s*['"]?link:/);
      if (match) names.add(match[1]);
    }
  }
  return names;
}

// Every node_modules directory in the repo, without descending into one
function nodeModulesDirs(dir, found = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    if (entry.name === '.git' || entry.name === 'dist' || entry.name === '.nx') continue;
    const path = join(dir, entry.name);
    if (entry.name === 'node_modules') {
      found.push(path);
      continue;
    }
    nodeModulesDirs(path, found);
  }
  return found;
}

// Direct package entries of a node_modules dir, descending one level into @scope folders
function packageEntries(nodeModules) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(nodeModules, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const path = join(nodeModules, entry.name);
    if (entry.name.startsWith('@') && entry.isDirectory() && !entry.isSymbolicLink()) {
      for (const scoped of readdirSync(path, { withFileTypes: true })) {
        results.push({ name: `${entry.name}/${scoped.name}`, path: join(path, scoped.name), entry: scoped });
      }
      continue;
    }
    results.push({ name: entry.name, path, entry });
  }
  return results;
}

const keep = activeLinkOverrides();
const orphans = [];

for (const nodeModules of nodeModulesDirs(repoRoot)) {
  for (const { name, path, entry } of packageEntries(nodeModules)) {
    if (!entry.isSymbolicLink()) continue;
    let target;
    try {
      target = realpathSync(path);
    } catch {
      // A link whose target no longer exists is broken, so it is an orphan by definition
      orphans.push({ name, path, target: '(broken)' });
      continue;
    }
    // Inside the repo means a workspace package — pnpm owns it
    if (target === repoRoot || target.startsWith(`${repoRoot}/`)) continue;
    if (keep.has(name)) continue;
    orphans.push({ name, path, target });
  }
}

if (orphans.length === 0) {
  console.log(`No escaping symlinks found${keep.size ? ` (kept active link overrides: ${[...keep].join(', ')})` : ''}.`);
  process.exit(0);
}

for (const { name, path, target } of orphans) {
  // unlink, never rm -r: the link points at a real source repo and recursive delete would eat it
  if (!dryRun) unlinkSync(path);
  console.log(`${dryRun ? 'would remove' : 'removed'}  ${name}  ${relative(repoRoot, path)} -> ${target}`);
}

if (keep.size > 0) console.log(`\nKept active link overrides: ${[...keep].join(', ')}`);
console.log(
  dryRun
    ? `\n${orphans.length} orphan(s) would be removed. Re-run without --dry, then \`pnpm install\`.`
    : `\n${orphans.length} orphan(s) removed. Run \`pnpm install\` to restore the registry copies.`,
);
