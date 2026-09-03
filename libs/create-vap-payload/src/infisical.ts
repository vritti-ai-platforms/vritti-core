import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

/**
 * Reading a workspace to find out what a site is already configured for.
 *
 * The workspace id is the first thing asked and the only mandatory answer,
 * because every script in a scaffolded site runs under `infisical run --` and
 * without a workspace none of them start. Having it first also makes the three
 * questions after it answerable: a workspace that already holds `S3_BUCKET`
 * belongs to a site that wants media, and one holding `VRITTI_APP_CLIENT_ID`
 * belongs to a site that talks to core.
 *
 * **Key names only, never values.** Nothing here reads, prints or stores a
 * secret's contents — the questions this informs need to know whether a key
 * exists, and a generator has no business holding the value.
 */
export interface WorkspaceKeys {
  available: boolean;
  names: Set<string>;
  reason?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when this looks like an Infisical project id at all, before any network call. */
export function isWorkspaceId(value: string): boolean {
  return UUID.test(value.trim());
}

/**
 * The secret names defined in a workspace's `dev` environment.
 *
 * Degrades rather than blocks: a missing CLI, an expired login, no network and
 * an id that turns out not to exist all return `available: false` with a reason
 * to print, and the caller falls back to asking its questions plainly. A
 * scaffolder that cannot run without a working Infisical session would be
 * unusable exactly when someone is setting a machine up for the first time.
 */
export async function readWorkspaceKeys(workspaceId: string, environment = 'dev'): Promise<WorkspaceKeys> {
  if (!isWorkspaceId(workspaceId)) {
    return { available: false, names: new Set(), reason: 'that is not a workspace id' };
  }

  try {
    const { stdout } = await run(
      'infisical',
      [
        'secrets',
        '--projectId',
        workspaceId,
        '--env',
        environment,
        '--recursive',
        // Personal overrides take priority by default, so without this the
        // answer describes whoever is running the command rather than the
        // project every deployment of this site will read.
        '--secret-overriding=false',
        '--silent',
      ],
      { timeout: 20_000, maxBuffer: 8 * 1024 * 1024 },
    );
    return { available: true, names: parseSecretNames(stdout) };
  } catch (error) {
    const reason =
      error instanceof Error && 'code' in error && (error as { code?: unknown }).code === 'ENOENT'
        ? 'the infisical CLI is not on PATH'
        : 'could not read that workspace (not logged in, no network, or no access)';
    return { available: false, names: new Set(), reason };
  }
}

/**
 * Lifts the key column out of the CLI's table output.
 *
 * Deliberately tolerant: this drives a set of defaults, so a table whose
 * borders change between CLI versions should cost a helpful default and never
 * fail a scaffold. Anything that does not look like an environment variable
 * name is dropped, which is what discards the header and the rules.
 */
function parseSecretNames(stdout: string): Set<string> {
  const names = new Set<string>();
  for (const line of stdout.split('\n')) {
    for (const cell of line.split('│')) {
      const candidate = cell.trim();
      if (/^[A-Z][A-Z0-9_]*$/.test(candidate) && candidate !== 'SECRET' && candidate !== 'KEY') {
        names.add(candidate);
      }
    }
  }
  return names;
}
