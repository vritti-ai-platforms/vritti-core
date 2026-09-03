# @vritti/create-vap-payload

Scaffolds a Vritti Payload 3 + Next.js site.

The `create-` prefix is load-bearing, not decoration: npm's initializer
resolution maps `pnpm create @vritti/vap-payload` to a package named
`@vritti/create-vap-payload`. Renaming it away would leave `npx` as the only way
in, so the prefix stays even though nothing here reads it.

```bash
pnpm create @vritti/vap-payload my-site
# or, off pnpm:
npx @vritti/create-vap-payload@latest my-site
```

## What it asks

```
1. Infisical workspace id     mandatory, first
2. Media uploads (S3/R2)?     y/n
3. Admin sign-in with cloud?  y/n
4. Shopper identity (vap)?    y/n
5. Site code                  schema, migration prefix, image name
6. Brand display name         page titles, email sender, site name in the chrome
```

The workspace id comes first because every script in the emitted site runs under
`infisical run --`, so a site without one cannot start. The environment is
`prod` — that is the one Vritti Cloud populates, so a site pointed anywhere else
finds no secrets at all. See `DEFAULT_ENVIRONMENT` in `src/infisical.ts` for what
that costs and when to add per-environment scripts. It also makes the three
questions after it answerable: the CLI reads the workspace's secret **key names**
(never values — nothing is read, printed or stored) and defaults each answer from
what is already configured, then names anything missing once the scaffold is
written. Not logged in, no network or no access degrades to asking plainly.

## What a scaffolded site starts with

`users` (staff, locked down), `media` (if you took uploads), both route groups,
the admin panel, and a header/footer whose site name is a **constant in
`layout.tsx`** — no globals, so nothing there is editable from the panel yet.
That is deliberate: it keeps the starting point small, and a global added on day
one is a schema decision made before anybody knows what the site needs. Add a
`site-settings` global and read it in the layout the moment somebody other than
a developer has to change the header.

## Not templates — one canonical source

`source/` holds exactly **one** copy of the site, with each optional block
wrapped in a marker:

```ts
// #region feature:vap
import { vap } from '@vritti/vap-sdk/payload'
// #endregion feature:vap
```

Scaffolding *deletes* the regions whose feature was declined. Three independent
questions make eight possible shapes of `payload.config.ts`; keeping eight copies
is how the three existing sites ended up with configs nobody could diff, and
building one from fragments would mean the canonical file exists nowhere and can
never be read or typechecked. Deletion from real code is the third option.

Imports sit inside their own markers rather than being pruned afterwards, so a
block and the imports it needs are declared together. That is why
`@vritti/vap-sdk/payload` is imported more than once in the canonical file: `vap`
and `vrittiCloudAuth` are separate answers, so they cannot share a statement.

Two guards run on every file written — a surviving `#region` marker or an
unreplaced `__TOKEN__` is a hard failure, because both produce a repo that looks
fine and breaks much later.

### File name disguises

| In `source/` | Written as | Why |
|---|---|---|
| `_gitignore` | `.gitignore` | npm excludes `.gitignore` from a published tarball |
| `package.json.template` | `package.json` | a real one here would be found by this monorepo |

## What it deliberately does not do

- **No import map.** `src/app/(payload)/admin/importMap.js` ships empty because
  generating it needs a resolved dependency tree. `pnpm generate:importmap` is in
  the printed steps; skip it and /admin renders
  "PayloadComponent not found in importMap" for every component a plugin
  registers.
- **No secrets, and no `.env`.** The one exception is `PAYLOAD_SECRET`, which is
  randomness rather than an issued credential: it is generated, printed with the
  command that stores it, and written nowhere.
- **No Infisical project, Gitea repo, cloud OAuth app or bucket.** Those need
  tokens a scaffolder should not hold.
- **No migrations.** They need a live database. `src/migrations/index.ts` ships
  empty and the next steps print the sequence.

  `db:migrate:create` runs `scripts/ensure-schema.mjs` afterwards, which inserts
  `CREATE SCHEMA IF NOT EXISTS` into the first migration. Payload qualifies every
  statement with the schema but never creates it, and it cannot be fixed
  anywhere else: a schema-only migration dies recording itself in a
  `payload_migrations` table the generated migration has not created yet, and an
  npm script never runs at all in production, where migrations are applied from
  inside Payload's startup. The script's own comment carries the full reasoning.

## One site code, no fallbacks that can drift

Every site code lands in five places, and the sites that exist got this wrong —
one declares `petstore` in `postgresAdapter`, in `vap()` and in its own
`.env.example` while every migration hardcodes `venkys-pet-store`, so following
that repo's own setup instructions builds a schema the app never reads. Asking
once and writing the answer everywhere is the most useful thing here.

## Testing it without publishing

```bash
pnpm build
npm pack --pack-destination /tmp                  # the exact published tarball
tar -tzf /tmp/vritti-create-vap-payload-0.1.0.tgz # nothing stripped?

mkdir -p /tmp/host && cd /tmp/host && npm init -y
npm install /tmp/vritti-create-vap-payload-0.1.0.tgz
./node_modules/.bin/create-vap-payload my-site --workspace <uuid> --yes
```

**Pack and install; do not run `dist/index.js` in place.** The two are not
equivalent, and the difference is the whole reason for the disguises above —
measured, not assumed: dropping a real `.gitignore` and `.npmrc` into `source/`
and packing shows npm silently removes both from the tarball, while `_gitignore`
and `_npmrc` survive. A test that executes the working tree would pass either
way, and the first person to install from the registry would find out instead.
`npx <tarball>` does not work — npx tries to execute the file rather than install
it.

To exercise `pnpm create @vritti/vap-payload` itself — npm's initializer name
resolution, rather than anything in this package — publish to a local registry
once:

```bash
pnpm dlx verdaccio                       # :4873, leave it running

# Verdaccio's default config sets `publish: $authenticated` on '@*/*', so a
# scoped publish is refused anonymously. It self-registers any user.
npm adduser --registry http://localhost:4873

pnpm build && npm publish --registry http://localhost:4873

# `pnpm create` does NOT accept a trailing --registry: it resolves from npmjs
# and fails with ERR_PNPM_FETCH_404. Nor does `pnpm --registry=… create`, which
# is rejected as an unknown option. Use one of these instead:
npm_config_registry=http://localhost:4873 pnpm create @vritti/vap-payload my-site
npm create @vritti/vap-payload my-site --registry http://localhost:4873 -- --yes
# …or drop `registry=http://localhost:4873` in an .npmrc beside where you run it.
```

Re-publishing the same version is refused, so iterating needs
`npm unpublish @vritti/create-vap-payload@<v> --registry http://localhost:4873 --force`
or a version bump. Keep the local registry out of any committed `.npmrc` — one
there would break everybody else's install.

Worth doing once to prove the `create-` prefix resolves; it does not change
afterwards, so it does not belong in CI.

## Adding to the canonical source

`source/` is excluded from this package's `tsconfig.json` and from the root
`biome.json`, because its files reference `@/…` paths and dependencies that only
exist once scaffolded. It is verified by scaffolding to a temporary directory and
building there — see `.github/workflows/create-vap-payload.yml`.

Two rules for anything added:

1. **Nothing shipped may import `@/payload-types`.** Those types are generated by
   `pnpm generate:types`, so a freshly scaffolded repo does not have them; an
   import would make a fresh clone fail to typecheck before it had done anything
   wrong. `lib/media.ts` declares the shape it touches instead.
2. **A new optional file is gated in `src/plan.ts`**, by the region that owns it.
   A file gated nowhere is always written.
