import type { ResponseCacheStore } from '../../core/transport/response-cache-store.js';

export const VAP_CACHE_TABLE = 'vap_cache';

interface PoolLike {
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
}

export interface PostgresResponseCacheOptions {
  databaseUrl: string;

  databaseSchema?: string;

  logger?: { error: (...args: unknown[]) => void };
}

// A `ResponseCacheStore` over the `vap-cache` table.
export function createPostgresResponseCache(options: PostgresResponseCacheOptions): ResponseCacheStore {
  const schema = options.databaseSchema?.trim() || 'public';
  const table = `"${schema.replace(/"/g, '""')}"."${VAP_CACHE_TABLE}"`;

  let pool: PoolLike | undefined;
  let poolFailed = false;
  let queryWarned = false;

  // Runs a cache query, swallowing whatever it hits.
  async function attempt<T>(what: string, run: (db: PoolLike) => Promise<T>, fallback: T): Promise<T> {
    const db = await connect();
    if (!db) return fallback;
    try {
      return await run(db);
    } catch (error) {
      if (!queryWarned) {
        queryWarned = true;
        options.logger?.error({ err: error, table }, `Response cache ${what} failed — continuing without it`);
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

  return {
    get(key) {
      // Expiry is enforced in the query, so a stale row is never served even when nothing has swept it.
      return attempt(
        'read',
        async (db) => {
          const { rows } = await db.query(`select result from ${table} where key = $1 and expires_at > now()`, [key]);
          return rows[0]?.result ?? null;
        },
        null,
      );
    },

    async set(key, result, ttlSeconds) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      // Both timestamps are supplied rather than left to their DEFAULT now(): a column default fires only on insert, so
      // on the `do update` path updated_at would keep the value from when the row was first written and stop reflecting
      // when the entry was actually refreshed.
      await attempt(
        'write',
        (db) =>
          db.query(
            `insert into ${table} (key, result, expires_at, created_at, updated_at)
             values ($1, $2, $3, $4, $4)
             on conflict (key) do update
               set result = excluded.result, expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
            [key, JSON.stringify(result), expiresAt, now],
          ),
        undefined,
      );
    },

    async invalidate(keyPrefix) {
      // Prefix rather than equality: keys lead with the operation name for exactly this, so one operation's entries can
      // be dropped without knowing every variable combination behind them.
      await attempt(
        'invalidate',
        (db) => db.query(`delete from ${table} where key like $1 || '%'`, [keyPrefix]),
        undefined,
      );
    },
  };
}
