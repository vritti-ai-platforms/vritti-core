import { headers } from 'next/headers'

import { DATABASE_SCHEMA } from '@/lib/schema'
import { migrations } from '@/migrations'

export const dynamic = 'force-dynamic'

const SITE_NAME = '__BRAND__'

const TICKER = ['Scaffolded & running', 'Awaiting your first collection', 'Payload + Next']

/**
 * The first thing a scaffolded site shows: what it is, and what it still needs.
 *
 * Deliberately a *status* page rather than a welcome message. A fresh install
 * has no content, so the useful thing to render is its own configuration — which
 * features it was scaffolded with, whether the environment behind them is
 * actually set, and the next command to run. Replace the whole file once the
 * site has something to say.
 *
 * **It reads the environment but never the database.** Reporting live
 * connectivity would mean a query on the one route most likely to be opened
 * before Postgres exists, and a home page that hangs or 500s is a worse first
 * impression than one that is honest about what it cannot see. `migrations` is a
 * static import, so its length costs nothing.
 */
export default async function HomePage() {
  const host = (await headers()).get('host') ?? 'localhost:3000'
  const set = (name: string) => Boolean(process.env[name])

  const rows: { k: string; v: string; state?: 'ok' | 'warn'; x?: string; href?: string }[] = [
    {
      k: 'Admin',
      v: '/admin',
      x: 'Open',
      href: '/admin',
    },
    {
      k: 'Schema',
      // No env/fallback distinction to draw: `src/lib/schema.ts` refuses to
      // boot if DATABASE_SCHEMA disagrees with it, so there is only one value
      // this can be.
      v: DATABASE_SCHEMA,
    },
    {
      k: 'Database',
      v: set('DATABASE_URL') ? 'Configured' : 'DATABASE_URL not set',
      state: set('DATABASE_URL') ? 'ok' : 'warn',
    },
    {
      k: 'Migrations',
      // Short on purpose: `.v` is nowrap with an ellipsis, so a longer line is
      // truncated exactly where it matters most. The hint lives in the badge.
      v: migrations.length === 0 ? 'None yet' : `${migrations.length} recorded`,
      state: migrations.length === 0 ? 'warn' : 'ok',
      x: migrations.length === 0 ? 'db:migrate:create' : undefined,
    },
    // #region feature:media
    {
      k: 'Uploads',
      v: set('S3_BUCKET') ? 'S3 bucket configured' : 'S3_BUCKET not set',
      state: set('S3_BUCKET') ? 'ok' : 'warn',
    },
    // #endregion feature:media
    // #region feature:cloudAuth
    {
      k: 'Staff',
      v: set('VRITTI_OAUTH_CLIENT_ID') ? 'Vritti Cloud' : 'Password (local only)',
      state: set('VRITTI_OAUTH_CLIENT_ID') ? 'ok' : 'warn',
    },
    // #endregion feature:cloudAuth
    // #region feature:vap
    {
      k: 'Shoppers',
      v: set('VRITTI_APP_CLIENT_ID') ? 'Vritti core · phone code' : 'Core credentials not set',
      state: set('VRITTI_APP_CLIENT_ID') ? 'ok' : 'warn',
    },
    // #endregion feature:vap
  ]

  const ready = rows.every((row) => row.state !== 'warn')

  return (
    <div className="doc">
      <span className="mark tl" />
      <span className="mark tr" />
      <span className="mark bl" />
      <span className="mark br" />

      {/* The track is the phrase list twice over: the marquee translates by
          -50%, so the second copy is what makes the wrap seamless. */}
      <div className="ticker" aria-hidden="true">
        <div className="track">
          {[0, 1].map((copy) =>
            TICKER.map((phrase) => <span key={`${copy}-${phrase}`}>{phrase}</span>),
          )}
        </div>
      </div>

      <header className="bar top">
        <div className="id rise d1">
          <div className="frame">
            <span className="mono-mark">{SITE_NAME.trim().charAt(0).toUpperCase() || 'V'}</span>
          </div>
          <div className="meta">
            <b>{host}</b>
            <small className="mono">{SITE_NAME}</small>
          </div>
        </div>
        <div className="controls rise d1">
          <span className="live mono">
            <span className="dot" /> {ready ? 'Ready' : 'Setup'}
          </span>
        </div>
      </header>

      <main className="main">
        <div>
          <div className="kicker mono rise d2">
            Status <span className="code">/ {ready ? 'ready' : 'awaiting setup'}</span>
          </div>
          <h1 className="rise d3">
            Awaiting
            <br />
            content
            <span className="caret">▍</span>
          </h1>
          <p className="lede rise d4">
            <span className="site">{SITE_NAME}</span> is scaffolded and serving. It has no
            collections of its own yet — add them under <code>src/collections</code>, then generate
            and run a migration.
          </p>
        </div>

        <div className="manifest mono rise d5">
          {rows.map((row) => (
            <div className="r" key={row.k}>
              <span className="k">{row.k}</span>
              <span className={row.state ? `v ${row.state}` : 'v'}>{row.v}</span>
              {row.href ? (
                <a className="x" href={row.href}>
                  {row.x}
                </a>
              ) : (
                row.x && <span className="x">{row.x}</span>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="bar bot">
        <div className="l mono">
          <span>Payload + Next</span>
          <span className="sep" />
          <span>Schema {DATABASE_SCHEMA}</span>
        </div>
        <div className="credit mono">
          <span>Built with</span>
          <a href="https://vrittiai.com" target="_blank" rel="noopener">
            Vritti
          </a>
        </div>
      </footer>
    </div>
  )
}
