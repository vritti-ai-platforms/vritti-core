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

/**
 * The environment a scaffolded site resolves secrets from.
 *
 * `prod`, because that is the environment Vritti Cloud populates when it seals a
 * website's configuration — a site pointed at `dev` finds nothing there and will
 * not start. Named once and imported, rather than repeated as a literal
 * everywhere the environment is mentioned.
 *
 * The cost is real and worth stating: a bare `pnpm dev` therefore resolves
 * production secrets, `DATABASE_URL` included. That is survivable here only
 * because `push: false` keeps a dev boot from altering the schema, and because
 * this scaffold ships no test scripts — a test suite wired to this default is
 * how a sibling repo ends up creating rows in its live database. Add
 * per-environment scripts (`dotenv -e .env.dev`) before adding tests.
 */
export const DEFAULT_ENVIRONMENT = 'prod';

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
export async function readWorkspaceKeys(
  workspaceId: string,
  environment: string = DEFAULT_ENVIRONMENT,
): Promise<WorkspaceKeys> {
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
