import { createHash } from 'node:crypto';
import type { CachedResponse, ResponseCacheStore } from '../../core/transport/response-cache-store.js';

export const VAP_CACHE_TABLE = 'vap_cache';
export const VAP_CACHE_RESPONSES_TABLE = 'vap_cache_responses';

const DEFAULT_RETENTION_SECONDS = 7 * 24 * 60 * 60;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

interface PoolLike {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
  end(): Promise<void>;
}

export interface PostgresResponseCacheOptions {
  databaseUrl: string;

  databaseSchema?: string;

  // How long a key core has not confirmed is kept as a fallback. High-traffic sites can afford a day; a quiet one
  // wants a week, so a page nobody opened today still has something to show if core goes down tomorrow.
  retentionSeconds?: number;

  logger?: { error: (...args: unknown[]) => void };
}

// A `ResponseCacheStore` over two tables: `vap_cache` maps each key to a response, and `vap_cache_responses` holds
// each distinct response once — thousands of filter combinations that land on the same page share one row.
export function createPostgresResponseCache(options: PostgresResponseCacheOptions): ResponseCacheStore {
  const schema = `"${(options.databaseSchema?.trim() || 'public').replace(/"/g, '""')}"`;
  const keys = `${schema}."${VAP_CACHE_TABLE}"`;
  const responses = `${schema}."${VAP_CACHE_RESPONSES_TABLE}"`;
  const retentionSeconds =
    options.retentionSeconds && options.retentionSeconds > 0 ? options.retentionSeconds : DEFAULT_RETENTION_SECONDS;

  let pool: PoolLike | undefined;
  let poolFailed = false;
  let queryWarned = false;
  let lastSweep = 0;

  // Runs a cache query, swallowing whatever it hits.
  async function attempt<T>(what: string, run: (db: PoolLike) => Promise<T>, fallback: T): Promise<T> {
    const db = await connect();
    if (!db) return fallback;
    try {
      return await run(db);
    } catch (error) {
      if (!queryWarned) {
        queryWarned = true;
        options.logger?.error({ err: error, table: keys }, `Response cache ${what} failed — continuing without it`);
      }
      return fallback;
    }
  }

  // Opens the pool on first use.
  async function connect(): Promise<PoolLike | undefined> {
    if (pool || poolFailed) return pool;
    try {
      const pg = (await import('pg')) as unknown as {
        default?: { Pool: new (c: object) => PoolLike };
        Pool?: new (c: object) => PoolLike;
      };
      const Pool = pg.Pool ?? pg.default?.Pool;
      if (!Pool) throw new Error("the 'pg' module exposes no Pool");
      pool = new Pool({ connectionString: options.databaseUrl, max: 4 });
      return pool;
    } catch (error) {
      // Recorded once rather than on every request — a missing driver or a bad URL will not fix itself, and logging it
      // per request would bury everything else.
      poolFailed = true;
      options.logger?.error({ err: error }, 'Response cache unavailable — running without it');
      return undefined;
    }
  }

  // Drops keys core has not confirmed within the retention window, then responses no key points at any more. Only
  // ever reached from `set`, which only runs on an answer from core — so while core is down nothing is swept, and
  // every fallback survives the outage however long it lasts.
  async function sweep(db: PoolLike): Promise<void> {
    const now = Date.now();
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    await db.query(`delete from ${keys} where updated_at < now() - make_interval(secs => $1)`, [retentionSeconds]);
    await db.query(`delete from ${responses} r where not exists (select 1 from ${keys} k where k.response_id = r.id)`);
  }

  return {
    get(key): Promise<CachedResponse | null> {
      // Expired rows are returned too, marked stale: they are what the link serves while core cannot answer.
      return attempt(
        'read',
        async (db) => {
          const { rows } = await db.query(
            `select r.result, k.expires_at > now() as fresh
               from ${keys} k join ${responses} r on r.id = k.response_id
              where k.key = $1`,
            [key],
          );
          const row = rows[0];
          return row ? { result: row.result, fresh: row.fresh === true } : null;
        },
        null,
      );
    },

    async set(key, result, ttlSeconds) {
      const json = JSON.stringify(result);
      const hash = createHash('sha256').update(json).digest('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      await attempt(
        'write',
        async (db) => {
          // The response is stored once per distinct content, and never rewritten — a key whose answer changed is
          // pointed at another row rather than editing one other keys share. The key row itself is always updated in
          // place. A response inserted by this statement is invisible to its own subquery, hence the coalesce.
          await db.query(
            `with inserted as (
               insert into ${responses} (hash, result, created_at, updated_at)
               values ($1, $2, $3, $3)
               on conflict (hash) do nothing
               returning id
             )
             insert into ${keys} (key, response_id, expires_at, created_at, updated_at)
             values ($4, coalesce((select id from inserted), (select id from ${responses} where hash = $1)), $5, $3, $3)
             on conflict (key) do update
               set response_id = excluded.response_id, expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
            [hash, json, now, key, expiresAt],
          );
          await sweep(db);
        },
        undefined,
      );
    },

    async invalidate(keyPrefix) {
      // Expires rather than deletes: the next request asks core, but if core is down at that moment the old response
      // is still there to serve. Prefix rather than equality, because keys lead with the operation name.
      return attempt(
        'invalidate',
        async (db) => {
          const pattern = `${keyPrefix.replace(/[\\%_]/g, '\\$&')}%`;
          const { rowCount } = await db.query(
            `update ${keys} set expires_at = now() where key like $1 and expires_at > now()`,
            [pattern],
          );
          return rowCount ?? 0;
        },
        0,
      );
    },
  };
}
