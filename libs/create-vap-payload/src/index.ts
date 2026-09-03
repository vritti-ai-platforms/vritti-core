#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path';
import { exit, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { isWorkspaceId, readWorkspaceKeys, type WorkspaceKeys } from './infisical.js';
import { type Answers, buildPlan, validateProjectName, validateSiteCode } from './plan.js';
import { type Asker, defaultingAsker, interactiveAsker } from './prompts.js';
import { generatePayloadSecret, isUsableTarget, scaffold, writeInfisicalLink } from './scaffold.js';
import { VERSIONS } from './versions.js';

const SOURCE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'source');

const USAGE = `
Scaffolds a Vritti Payload site.

  pnpm create @vritti/vap-payload <directory> [options]
  npx @vritti/create-vap-payload@latest <directory> [options]

Options
  --workspace <id>   Infisical project id (required; asked first if omitted)
  --site-code <code> Database schema, migration prefix and image name
  --brand <name>     Display name seeded into the panel and page titles
  --media            Include the media collection and S3 storage
  --no-media
  --cloud-auth       Admin sign-in with a Vritti Cloud account
  --no-cloud-auth
  --vap              Shopper identity and the core client
  --no-vap
  --yes              Take every default; never prompt
  --help
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      workspace: { type: 'string' },
      'site-code': { type: 'string' },
      brand: { type: 'string' },
      media: { type: 'boolean' },
      'no-media': { type: 'boolean' },
      'cloud-auth': { type: 'boolean' },
      'no-cloud-auth': { type: 'boolean' },
      vap: { type: 'boolean' },
      'no-vap': { type: 'boolean' },
      yes: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });

  if (values.help) {
    stdout.write(`${USAGE}\n`);
    return;
  }

  const ask = values.yes ? defaultingAsker() : interactiveAsker();
  try {
    await create(ask, values, positionals[0]);
  } finally {
    ask.close();
  }
}

type Flags = {
  workspace?: string;
  'site-code'?: string;
  brand?: string;
  media?: boolean;
  'no-media'?: boolean;
  'cloud-auth'?: boolean;
  'no-cloud-auth'?: boolean;
  vap?: boolean;
  'no-vap'?: boolean;
  yes?: boolean;
};

/**
 * Resolves a `--x` / `--no-x` pair into an answer, or undefined to go on asking.
 *
 * `parseArgs` has no notion of a negated boolean — it rejects `--no-x` as an
 * unknown option unless the option is declared under that exact name — so both
 * spellings are declared and reconciled here. Passing both is a mistake worth
 * naming rather than resolving by precedence.
 */
function decide(name: string, yes: boolean | undefined, no: boolean | undefined): boolean | undefined {
  if (yes && no) throw new Error(`--${name} and --no-${name} were both given.`);
  if (yes) return true;
  if (no) return false;
  return undefined;
}

async function create(ask: Asker, flags: Flags, positional: string | undefined): Promise<void> {
  const projectName =
    positional ?? (await ask.text('Project directory', { default: 'my-vap-site', validate: validateProjectName }));
  const nameProblem = validateProjectName(projectName);
  if (nameProblem) throw new Error(nameProblem);

  const target = resolve(process.cwd(), projectName);
  if (!(await isUsableTarget(target))) {
    throw new Error(`${target} already exists and is not empty.`);
  }

  // First, and mandatory: every script in the emitted site runs under
  // `infisical run --`, so a site without a workspace cannot be started at all.
  const workspaceId =
    flags.workspace ??
    (await ask.text('Infisical workspace id', {
      validate: (value) => (isWorkspaceId(value) ? null : 'Expected a project id (a UUID).'),
    }));
  if (!isWorkspaceId(workspaceId)) throw new Error('Expected an Infisical project id (a UUID).');

  // Asking the workspace what this site is already configured for turns the
  // three questions below from guesses into confirmations.
  const keys = await readWorkspaceKeys(workspaceId);
  reportProbe(keys);

  const media =
    decide('media', flags.media, flags['no-media']) ??
    (await ask.confirm('Media uploads (S3/R2)?', keys.names.has('S3_BUCKET')));
  const cloudAuth =
    decide('cloud-auth', flags['cloud-auth'], flags['no-cloud-auth']) ??
    (await ask.confirm('Admin sign-in with Vritti Cloud?', keys.names.has('VRITTI_OAUTH_CLIENT_ID')));
  const vap =
    decide('vap', flags.vap, flags['no-vap']) ??
    (await ask.confirm('Shopper identity via Vritti core (vap)?', keys.names.has('VRITTI_APP_CLIENT_ID')));

  // Named before it is asked for, because the answer has to match a value this
  // cannot read: the lookup returns key names only.
  if (keys.available && keys.names.has('DATABASE_SCHEMA')) {
    stdout.write('  That workspace already sets DATABASE_SCHEMA — the site code below must match it.\n');
  }
  const siteCode =
    flags['site-code'] ??
    (await ask.text('Site code', {
      default: defaultSiteCode(projectName),
      validate: validateSiteCode,
    }));
  const siteProblem = validateSiteCode(siteCode);
  if (siteProblem) throw new Error(siteProblem);

  const brand = flags.brand ?? (await ask.text('Brand display name', { default: titleCase(siteCode) }));

  const answers: Answers = {
    directory: target,
    projectName,
    workspaceId,
    siteCode,
    brand,
    media,
    cloudAuth,
    vap,
  };

  const plan = buildPlan(answers);
  const report = await scaffold(SOURCE_ROOT, target, plan);
  await writeInfisicalLink(target, workspaceId);

  // A marker the canonical tree declares but the plan never names is a typo in
  // one of the two, and it silently drops code — so it is checked rather than
  // trusted.
  const unknown = [...report.declared].filter((name) => !KNOWN_REGIONS.has(name));
  if (unknown.length > 0) {
    throw new Error(`source/ declares unknown region(s): ${unknown.join(', ')}`);
  }

  summarise(answers, keys, report.written.length, report.skipped.length);
}

const KNOWN_REGIONS = new Set(['feature:media', 'feature:cloudAuth', 'feature:vap', 'feature:sdk']);

function reportProbe(keys: WorkspaceKeys): void {
  if (keys.available) {
    stdout.write(`  Read ${keys.names.size} secret names from that workspace — using them as defaults.\n\n`);
    return;
  }
  stdout.write(`  Skipping workspace lookup: ${keys.reason}. Answering the next questions manually.\n\n`);
}

/**
 * Derives a site code from the directory name.
 *
 * The workspace lookup reads key names and never values, so when a workspace
 * already defines DATABASE_SCHEMA this cannot know what it is set to — the
 * caller warns about that instead, because the two must match and only a person
 * can confirm it.
 */
function defaultSiteCode(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^([0-9])/, 'site-$1');
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function summarise(answers: Answers, keys: WorkspaceKeys, written: number, skipped: number): void {
  const secret = generatePayloadSecret();
  const lines: string[] = [
    '',
    `  ${answers.projectName} — ${written} files written${skipped > 0 ? `, ${skipped} skipped` : ''}`,
    '',
    `    site code       ${answers.siteCode}`,
    `    payload / next  ${VERSIONS.payload} / ${VERSIONS.next}`,
    `    media uploads   ${answers.media ? 'yes' : 'no'}`,
    `    cloud admin     ${answers.cloudAuth ? 'yes' : 'no'}`,
    `    vap (shoppers)  ${answers.vap ? 'yes' : 'no'}`,
    '',
  ];

  // Named rather than merely defaulted: a Yes with no credential behind it
  // still scaffolds, and the failure surfaces much later as a request that
  // cannot reach core.
  const missing: string[] = [];
  if (keys.available) {
    if (answers.media && !keys.names.has('S3_BUCKET')) missing.push('S3_BUCKET (uploads will fail)');
    if (answers.cloudAuth && !keys.names.has('VRITTI_OAUTH_CLIENT_ID')) {
      missing.push('VRITTI_OAUTH_CLIENT_ID (the cloud login button will do nothing)');
    }
    if (answers.vap && !keys.names.has('VRITTI_APP_CLIENT_ID')) {
      missing.push('VRITTI_APP_CLIENT_ID (sign-in cannot reach core)');
    }
    if (!keys.names.has('DATABASE_URL')) missing.push('DATABASE_URL (nothing will start)');
    if (!keys.names.has('PAYLOAD_SECRET')) missing.push('PAYLOAD_SECRET (see below)');
  }

  if (missing.length > 0) {
    lines.push('  That workspace is missing:');
    for (const item of missing) lines.push(`    - ${item}`);
    lines.push('');
  }

  lines.push(
    '  Next:',
    `    cd ${answers.projectName}`,
    '    pnpm install',
    '',
    '  Store a signing secret (generated here, written nowhere):',
    `    infisical secrets set PAYLOAD_SECRET=${secret} \\`,
    `      --projectId=${answers.workspaceId} --env=dev`,
    '',
    '  Then create the schema and start:',
    `    infisical secrets set DATABASE_SCHEMA=${answers.siteCode} --projectId=${answers.workspaceId} --env=dev`,
    '    pnpm generate:types',
    '    pnpm db:migrate:create      # needs a real terminal; writes src/migrations/',
    '    pnpm db:migrate',
    '    pnpm dev',
    '',
  );

  stdout.write(`${lines.join('\n')}\n`);
}

main().catch((error: unknown) => {
  stdout.write(`\n  ${error instanceof Error ? error.message : String(error)}\n\n`);
  exit(1);
});
