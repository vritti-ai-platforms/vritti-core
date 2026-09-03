import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
// #region feature:media
import { s3Storage } from '@payloadcms/storage-s3'
// #endregion feature:media
// #region feature:sdk
import { consoleEmailAdapter } from '@vritti/vap-sdk/payload'
// #endregion feature:sdk
// #region feature:vap
import { vap } from '@vritti/vap-sdk/payload'
// #endregion feature:vap
// #region feature:cloudAuth
import { vrittiCloudAuth } from '@vritti/vap-sdk/payload'
// #endregion feature:cloudAuth
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

// #region feature:media
import { Media } from './collections/Media'
// #endregion feature:media
import { Users } from './collections/Users'
import {
  LIVE_PREVIEW_COLLECTIONS,
  LIVE_PREVIEW_GLOBALS,
  originFromHeaders,
  previewPath,
} from './lib/livePreview'
import { DATABASE_SCHEMA } from './lib/schema'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    // Staff only. Naming `users` here is what keeps any other auth-enabled
    // collection — a shopper account, say — from ever reaching this panel.
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— __BRAND__',
    },
    /**
     * Live Preview — the site in an iframe beside the fields.
     *
     * The URL is built from the request's own headers rather than from a Site
     * settings field: admin and site are one Next app, so the page being
     * previewed is always on the host the panel was reached on. Using a
     * canonical origin instead would frame production while you edit locally.
     *
     * Returning null hides the pane, which is what a document with no address
     * yet should do.
     */
    livePreview: {
      collections: LIVE_PREVIEW_COLLECTIONS,
      globals: LIVE_PREVIEW_GLOBALS,
      breakpoints: [
        { name: 'phone', label: 'Phone', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 834, height: 1112 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
      url: ({ collectionConfig, globalConfig, data, req }) => {
        const target = previewPath({
          globalSlug: globalConfig?.slug,
          collectionSlug: collectionConfig?.slug,
          data,
        })
        if (!target) return null
        return `${originFromHeaders(req.headers)}${target}`
      },
    },
    // #region feature:cloudAuth
    // No `components.graphics` here on purpose. The login-screen lockup ships
    // from @vritti/vap-sdk and `vrittiCloudAuth` registers it — but only when
    // this config sets no Logo of its own, so putting one back here would take
    // the slot and pin this site to a copy that stops tracking the brand.
    // #endregion feature:cloudAuth
  },
  // #region feature:vap
  // `customers` and `vap-cache` are absent on purpose: vap() appends them, so
  // this site does not declare the shopper-identity tables it shares with every
  // other one.
  // #endregion feature:vap
  collections: [
    Users,
    // #region feature:media
    Media,
    // #endregion feature:media
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // The instance is shared with other apps, so this project's tables are
    // namespaced rather than loose in `public`. Declared in src/lib/schema.ts,
    // which explains why it is a constant and not read from the environment.
    schemaName: DATABASE_SCHEMA,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    /**
     * **No dev push.** Payload's default is to diff this config against the
     * schema on every dev boot and alter the database to match. A `pnpm dev`
     * pointed at a shared or production DATABASE_URL would then rewrite those
     * tables — silently, from a branch, with no migration recorded and nobody
     * asked. It also leaves a `dev`/batch -1 row in payload_migrations, which
     * makes the production container's startup migration ask an interactive
     * question, answer itself "no" for want of a TTY, and exit 0: a deploy that
     * reports success and never serves.
     *
     * The cost is that a field change no longer appears by magic — generate a
     * migration and run it:
     *
     *   pnpm generate:types
     *   pnpm db:migrate:create
     *   pnpm db:migrate
     *
     * The adapter reads this once, when it connects, so restart `pnpm dev`
     * after touching anything in this block.
     */
    push: false,
    // The production image is built without database access; pending migrations
    // run automatically when the server starts.
    prodMigrations: migrations,
  }),
  // #region feature:sdk
  // Nothing here sends mail. Payload's own fallback logs only that an email was
  // attempted, with the recipient and subject — enough to know a password reset
  // happened, not enough to complete one, because the token lives in the body it
  // discards. This adapter prints the body and lifts any links to the top.
  //
  // Replace it with @payloadcms/email-nodemailer or @payloadcms/email-resend
  // before anything depends on mail actually arriving: every message it handles
  // is one nobody received.
  email: consoleEmailAdapter({ fromName: '__BRAND__' }),
  // #endregion feature:sdk
  sharp,
  plugins: [
    // #region feature:media
    /**
     * Uploads go to S3-compatible storage, always — there is no local-disk
     * fallback. The plugin sets `disableLocalStorage` on the collection, so
     * nothing is ever written next to the app.
     *
     * Unconditional rather than gated on `S3_BUCKET` being set, deliberately: a
     * fallback that silently writes to the container's own filesystem looks like
     * it works right up until the container is replaced and every image 404s.
     * Misconfigured credentials now fail loudly on the first upload, which is
     * the failure you want — visible, immediate, and before launch.
     *
     * Not thrown at config load, though: `pnpm build` runs with no secrets and
     * must keep doing so.
     *
     * Files are still served through Payload's /api/media/file/** route (the
     * adapter streams from the bucket), so access control and next/image's
     * localPatterns allow-list keep working unchanged.
     */
    s3Storage({
      enabled: true,
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        // R2 and most S3-compatibles use path-style bucket addressing.
        forcePathStyle: true,
      },
    }),
    // #endregion feature:media
    // #region feature:vap
    /**
     * Shopper identity, from the package rather than hand-written here.
     *
     * Generates the `customers` collection — phone plus a one-time code, no
     * password — and the `vap-cache` table, and parks the signed core client on
     * the config for `getSdk` to find. Deliberately not the `users` collection:
     * only `users` is wired to `admin.user`, so a shopper has no route into this
     * panel even if these access rules were later loosened by mistake.
     *
     * The credentials are read here and passed in — the SDK reads no environment
     * of its own, so this file is the one place that names them. Nothing is
     * validated at config time, so a site with these unset still boots and still
     * serves; only the first request that needs core fails.
     */
    vap({
      endpoint: process.env.CORE_GRAPHQL_URL,
      clientId: process.env.VRITTI_APP_CLIENT_ID,
      clientSecret: process.env.VRITTI_APP_CLIENT_SECRET,
      databaseUrl: process.env.DATABASE_URL,
      // The same constant as postgresAdapter's schemaName above. Anything else
      // and the cache addresses a table that is not there — it falls back to
      // `public` when empty, which is a table nothing created.
      databaseSchema: DATABASE_SCHEMA,
    }),
    // #endregion feature:vap
    // #region feature:cloudAuth
    /**
     * Staff identity, from Vritti Cloud rather than from a password in this
     * database.
     *
     * Whoever is a member of the organization that owns this website can sign in
     * to the panel with the account they already have; nobody else can, and a
     * member who is removed loses their account here at the next attempt.
     *
     * `allowPasswordLogin` is **local only**. OAuth cannot complete against
     * localhost — cloud derives a website's allowed callbacks as
     * `https://<provisioned host>`, so a plaintext `http://localhost` one is
     * never in the set — which would otherwise leave no way into the panel while
     * developing.
     *
     * Off everywhere else, and that is the point: in production the panel's
     * membership is cloud's to decide, and a password door standing beside it
     * outlives the membership that justified it.
     */
    vrittiCloudAuth({
      consentUrl: process.env.VRITTI_OAUTH_CONSENT_URL,
      apiUrl: process.env.VRITTI_OAUTH_API_URL,
      clientId: process.env.VRITTI_OAUTH_CLIENT_ID,
      clientSecret: process.env.VRITTI_OAUTH_CLIENT_SECRET,
      allowPasswordLogin: process.env.NODE_ENV !== 'production',
    }),
    // #endregion feature:cloudAuth
  ],
})
