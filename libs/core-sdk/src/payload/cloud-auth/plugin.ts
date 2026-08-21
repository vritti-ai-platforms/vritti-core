import type { CollectionLike, ConfigLike, PayloadPlugin } from '../runtime';
import { applyCloudAuth } from './collection';
import { buildEndpoints } from './endpoints';
import type { VrittiCloudAuthOptions } from './types';

const LOGIN_BUTTON = '@vritti/core-sdk/payload/client#VrittiCloudLoginButton';
const BRAND_LOGO = '@vritti/core-sdk/payload/client#VrittiAdminLogo';

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

// Sign in to this site's admin panel with a Vritti Cloud account.
export function vrittiCloudAuth(options: VrittiCloudAuthOptions = {}): PayloadPlugin {
  const { enabled = true } = options;

  return <T extends ConfigLike>(config: T): T => {
    if (enabled === false) return config;

    const typed = config as AuthConfigLike;
    // Defaults to whatever collection the panel already signs in.
    const slug = options.collection ?? typed.admin?.user ?? 'users';

    const collections = (typed.collections ?? []) as CollectionLike[];
    if (!collections.some((collection) => collection.slug === slug)) {
      throw new Error(
        `vrittiCloudAuth() cannot find the "${slug}" collection — add it to the config, or pass { collection } to point at the admin one.`,
      );
    }

    // The login-screen graphic: Payload's mark × Vritti's.
    const graphics = typed.admin?.components?.graphics;
    const brandLogo = options.brandLogo !== false && !graphics?.Logo;

    // Cast because spreading a generic and adding known keys cannot be proven to still be `T`.
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
