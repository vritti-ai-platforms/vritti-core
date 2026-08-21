import type { CollectionLike, ConfigLike, PayloadPlugin } from '../runtime';
import { applyCloudAuth } from './collection';
import { buildEndpoints } from './endpoints';
import type { VrittiCloudAuthOptions } from './types';

// The components the admin panel renders. Paths rather than imports: Payload resolves them through the
// app's generated import map, so the consumer runs `payload generate:importmap` after adding this.
const LOGIN_BUTTON = '@vritti/core-sdk/payload/client#VrittiCloudLoginButton';
const BRAND_LOGO = '@vritti/core-sdk/payload/client#VrittiAdminLogo';

/** The config this plugin reads and writes — `vrittiCore`'s ConfigLike plus the parts login needs. */
interface AuthConfigLike extends ConfigLike {
  admin?: {
    user?: string;
    components?: {
      beforeLogin?: unknown[];
      graphics?: { Logo?: unknown; Icon?: unknown; [key: string]: unknown };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  endpoints?: unknown[];
}

/**
 * Sign in to this site's admin panel with a Vritti Cloud account.
 *
 * ```ts
 * plugins: [ vrittiCore(), vrittiCloudAuth() ]
 * ```
 *
 * Members of the organization that owns the website sign in with the account they already have; nobody
 * else can, and no account is created for anyone cloud has not vouched for. **It is a sign-in, never a
 * sign-up** — cloud is the only place a person becomes a member, and this plugin's local records are a
 * mirror of that decision. When a member is removed, their admin record is deleted: at their next
 * attempt, and within the revalidation window if they are signed in at the time.
 *
 * No credentials to pass on a provisioned website: cloud seals `VRITTI_OAUTH_*` into the container when an
 * OAuth app is selected for it, and anything passed here wins over the environment. Nothing is read at
 * config time, so a site with the login misconfigured still boots and still serves — the failure lands on
 * the sign-in that needs it.
 *
 * **Password login is off by default.** See `applyCloudAuth` for exactly what that switches, and
 * `allowPasswordLogin` for the escape hatch while rolling an existing site over.
 */
export function vrittiCloudAuth(options: VrittiCloudAuthOptions = {}): PayloadPlugin {
  const { enabled = true } = options;

  return <T extends ConfigLike>(config: T): T => {
    if (enabled === false) return config;

    const typed = config as AuthConfigLike;
    // Defaults to whatever the panel already signs in — a plugin that targeted the wrong collection would
    // add columns nobody reads and leave the real login untouched.
    const slug = options.collection ?? typed.admin?.user ?? 'users';

    const collections = (typed.collections ?? []) as CollectionLike[];
    if (!collections.some((collection) => collection.slug === slug)) {
      throw new Error(
        `vrittiCloudAuth() cannot find the "${slug}" collection — add it to the config, or pass { collection } to point at the admin one.`,
      );
    }

    // The login-screen graphic: Payload's mark × Vritti's. Only when the site has not set one of its own —
    // an explicit `graphics.Logo` in a consumer's config is a decision, and a plugin that silently replaced
    // it would be rebranding somebody else's admin panel behind their back.
    const graphics = typed.admin?.components?.graphics;
    const brandLogo = options.brandLogo !== false && !graphics?.Logo;

    // Cast because spreading a generic and adding known keys cannot be proven to still be `T`. It is:
    // every key written here is declared on the config shapes above.
    return {
      ...config,
      collections: collections.map((collection) =>
        collection.slug === slug ? applyCloudAuth(collection, { ...options, collection: slug }) : collection,
      ),
      admin: {
        ...typed.admin,
        components: {
          ...typed.admin?.components,
          beforeLogin: [...(typed.admin?.components?.beforeLogin ?? []), LOGIN_BUTTON],
          ...(brandLogo ? { graphics: { ...graphics, Logo: BRAND_LOGO } } : {}),
        },
      },
      endpoints: [...(typed.endpoints ?? []), ...buildEndpoints({ ...options, collection: slug })],
    } as T;
  };
}
