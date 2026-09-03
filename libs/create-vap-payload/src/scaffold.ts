import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { DEFAULT_ENVIRONMENT } from './infisical.js';
import type { Plan } from './plan.js';
import { applyRegions, hasMarkers } from './regions.js';

/**
 * Writing the site out.
 *
 * Every file in `source/` is copied, with three transformations on the way:
 * regions the answers declined are deleted, `__TOKEN__` sentinels are replaced,
 * and the name is un-disguised.
 *
 * Two disguises, because there are two reasons a canonical file cannot sit under
 * its real name:
 *
 *   `_gitignore`            -> `.gitignore`      leading underscore means dot
 *   `package.json.template` -> `package.json`    the suffix is simply dropped
 *
 * Dotfiles are prefixed because npm excludes `.gitignore` from a published
 * tarball, so one shipped under its real name is not there when the package is
 * installed from the registry — the classic mistake in this kind of tool. Every
 * dotfile is prefixed rather than only the ones npm blocklists, so nobody has to
 * remember which those are.
 *
 * `package.json` is suffixed for a different reason: a real one here would be
 * found by the monorepo this package lives in and treated as a project to
 * install and build. It is *not* a dotfile, which is why it cannot share the
 * underscore rule — that turned it into `.package.json`.
 */

const TOKEN = /__[A-Z][A-Z0-9_]*__/g;

/** Files copied byte-for-byte: no regions, no tokens, no underscore. */
const BINARY_SAFE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.ico', '.woff', '.woff2', '.ttf']);

export interface WriteReport {
  written: string[];
  skipped: string[];
  /** Regions the canonical tree declared, so the caller can catch a typo'd marker. */
  declared: Set<string>;
}

/** Copies `source/` into the target directory, applying the plan. */
export async function scaffold(sourceRoot: string, target: string, plan: Plan): Promise<WriteReport> {
  const report: WriteReport = { written: [], skipped: [], declared: new Set() };
  await walk(sourceRoot, sourceRoot, target, plan, report);
  return report;
}

async function walk(root: string, current: string, target: string, plan: Plan, report: WriteReport): Promise<void> {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    const rel = relative(root, absolute);

    if (entry.isDirectory()) {
      await walk(root, absolute, target, plan, report);
      continue;
    }

    // Gated by the *canonical* path, before the underscore is stripped, so the
    // manifest in plan.ts reads the way the file is named in the repo.
    const gate = plan.gatedFiles[toPosix(rel)];
    if (gate && !plan.regions.has(gate)) {
      report.skipped.push(toPosix(rel));
      continue;
    }

    const destination = join(target, undisguise(rel));
    await mkdir(dirname(destination), { recursive: true });

    if (BINARY_SAFE.has(extensionOf(entry.name))) {
      await writeFile(destination, await readFile(absolute));
      report.written.push(toPosix(undisguise(rel)));
      continue;
    }

    const raw = await readFile(absolute, 'utf8');
    const { content, seen } = applyRegions(raw, plan.regions);
    for (const name of seen) report.declared.add(name);

    const filled = content.replace(TOKEN, (match) => {
      const value = plan.tokens[match];
      if (value === undefined) {
        throw new Error(`${toPosix(rel)} uses ${match}, which the plan does not define`);
      }
      return value;
    });

    // Both guards protect against the same class of bug: a scaffold that looks
    // fine, commits fine, and fails much later. An unreplaced token or a
    // surviving marker means the canonical tree and this code disagree.
    if (hasMarkers(filled)) {
      throw new Error(`${toPosix(rel)} still contains a #region marker after assembly`);
    }
    const leftover = filled.match(TOKEN);
    if (leftover) {
      throw new Error(`${toPosix(rel)} still contains ${leftover[0]} after substitution`);
    }

    await writeFile(destination, filled, 'utf8');
    report.written.push(toPosix(undisguise(rel)));
  }
}

/**
 * The Infisical link, written rather than produced by `infisical init`.
 *
 * `init` is interactive and picks its own defaults; this needs an exact shape.
 * `defaultEnvironment` comes from `DEFAULT_ENVIRONMENT`, which explains why it
 * is what it is.
 */
export async function writeInfisicalLink(target: string, workspaceId: string): Promise<void> {
  const body = {
    workspaceId,
    defaultEnvironment: DEFAULT_ENVIRONMENT,
    secretPath: '/',
    gitBranchToEnvironmentMapping: null,
  };
  await writeFile(join(target, '.infisical.json'), `${JSON.stringify(body, null, 2)}\n`, 'utf8');
}

/**
 * A fresh signing secret, printed and never stored.
 *
 * The one credential a generator can legitimately produce, because it is
 * randomness rather than something issued: no bucket, no OAuth app and no
 * client key can be invented here, but `PAYLOAD_SECRET` is only required to be
 * long and unguessable. It goes to the terminal with the command that stores
 * it, so it reaches Infisical without ever touching the filesystem.
 */
export function generatePayloadSecret(): string {
  return randomBytes(48).toString('base64url');
}

/** True when a directory is absent or has nothing in it — the only safe scaffold target. */
export async function isUsableTarget(target: string): Promise<boolean> {
  try {
    const info = await stat(target);
    if (!info.isDirectory()) return false;
    return (await readdir(target)).length === 0;
  } catch {
    return true;
  }
}

const TEMPLATE_SUFFIX = '.template';

function undisguise(relativePath: string): string {
  return relativePath
    .split(sep)
    .map((segment) => {
      if (segment.endsWith(TEMPLATE_SUFFIX)) return segment.slice(0, -TEMPLATE_SUFFIX.length);
      if (segment.startsWith('_')) return `.${segment.slice(1)}`;
      return segment;
    })
    .join(sep);
}

function toPosix(value: string): string {
  return value.split(sep).join('/');
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}
