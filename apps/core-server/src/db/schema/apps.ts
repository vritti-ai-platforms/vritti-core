import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { boolean, index, jsonb, text, timestamp, uniqueIndex, uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import { coreSchema } from './core-schema';
import { appTypeEnum } from './enums';
import { organizations } from './organizations';

/**
 * API credentials an organization issues so an external client can talk to this
 * deployment.
 *
 * Created from cloud-web and written here over the signed webhook, the same way
 * org users are — cloud owns the screen, core owns the record, because core is
 * what has to verify the credential on every request.
 *
 * The keypair mirrors `cloud.deployments.signing_key` / `signing_public_key`
 * exactly, including storing both halves as plain text. That is deliberate: the
 * deployment keypair is the more powerful secret of the two and already sits
 * this way, so encrypting only this table would harden the weaker one while
 * adding a per-deployment `ENCRYPTION_KEY` to provision and rotate. At-rest
 * encryption for signing keys is worth doing across both tables at once, or not
 * at all.
 *
 * The private half is readable on purpose — the SDK needs it in the client's
 * environment, so an operator has to be able to fetch it again after the day it
 * was minted.
 *
 * No RLS, matching `users` and `party_identities`: the lookup that resolves a
 * client to its organization necessarily runs before any org context exists.
 */
export const apps = coreSchema.table(
  'apps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    /**
     * The public identifier the client sends. Generated rather than being the
     * organization id, so one organization can hold several apps — a storefront
     * and a partner integration are different callers with different keys and
     * separate revocation.
     */
    clientId: varchar('client_id', { length: 64 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    type: appTypeEnum('type').notNull(),
    /**
     * What this credential is allowed to do, keyed by bare feature code.
     *
     * The same `FeatureUnlocks` shape as `roles.features`, deliberately: permission
     * resolution feeds it to `resolveUserFeatures` in place of a user's merged role
     * grants, so an app gets the identical treatment — plan and BU locks applied,
     * prerequisites enforced (a grant of `add` without `view` yields neither). An app
     * therefore can never exceed what the organization's plan entitles.
     *
     * Only the credential's own surface bucket is meaningful: resolution reads the bucket of
     * this row's `type` (GRAPHQL → `graphql`, HTTP → `http`), so a `web`/`mobile` array — or a
     * grant on the sibling surface — is inert. A legacy `app` bucket from before the split is
     * still honoured at read time as "either surface". Per-surface buckets are also what let a
     * plan entitle GraphQL and HTTP access independently.
     *
     * Empty by default, which denies everything: a new credential authenticates but
     * can do nothing until it is granted something.
     */
    permissions: jsonb('permissions').$type<FeatureUnlocks>().notNull().default({}),
    /** Ed25519 private key, base64 pkcs8 DER. Goes in the client's environment. */
    signingKey: text('signing_key').notNull(),
    /** Ed25519 public key, base64 spki DER. What request signatures verify against. */
    signingPublicKey: text('signing_public_key').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The hot path — resolved on every signed request from a client.
    uniqueIndex('apps_client_id_unique').on(table.clientId),
    index('idx_apps_org').on(table.organizationId),
  ],
);

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
