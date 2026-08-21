import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CloudAuthCredentialOptions } from './config';

/**
 * The slice of a Payload instance this plugin touches.
 *
 * Structural rather than importing `Payload`, for the same reason the core plugin's `ConfigLike` is:
 * naming one installed copy of payload in the built types makes a consumer that resolves a different
 * patch fail with "type is not assignable to itself".
 */
export interface PayloadInstance {
  secret: string;
  config: { cookiePrefix?: string; serverURL?: string };
  collections: Record<string, { config: CollectionRuntimeConfig }>;
  find(args: {
    collection: string;
    where?: unknown;
    limit?: number;
    depth?: number;
    pagination?: boolean;
  }): Promise<{ docs: unknown[] }>;
  create(args: { collection: string; data: Record<string, unknown> }): Promise<unknown>;
  update(args: { collection: string; id: string | number; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { collection: string; id: string | number }): Promise<unknown>;
  logger?: { error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
}

export interface CollectionRuntimeConfig {
  slug: string;
  auth: { tokenExpiration: number; useSessions?: boolean };
}

/** A mirrored admin account, as this plugin reads it back. */
export interface MirroredUser {
  id: string | number;
  email?: string | null;
  cloudUserId?: string | null;
  cloudCheckedAt?: string | null;
  sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[];
  [key: string]: unknown;
}

export interface VrittiCloudAuthOptions extends CloudAuthCredentialOptions {
  /** Mirrors `s3Storage` — off leaves the config untouched, so a branch can disable it without edits. */
  enabled?: boolean;

  /** The admin collection to sign in to. Must be the one named by `admin.user`. */
  collection?: string;

  /**
   * Keep Payload's email + password login working alongside this.
   *
   * Off by default: the point of the plugin is that org membership decides who administers the site, and
   * a second door with its own passwords outlives the membership that justified it. Turn it on while
   * rolling an existing site over, then turn it off.
   */
  allowPasswordLogin?: boolean;

  /**
   * How stale a membership check may be before an authenticated request revalidates it, in minutes.
   *
   * Zero checks on every request, which is correct but chatty. The default trades a short window for one
   * call per admin per quarter of an hour.
   */
  revalidateAfterMinutes?: number;

  /** Extra fields appended to the admin collection, for a site's own columns. */
  fields?: Field[];

  /** Where to land in the admin panel after a successful sign-in. */
  adminRoute?: string;
}
