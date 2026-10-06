import type { OtpMessages } from '@vritti/vap-sdk';
import { type PayloadLike, VAP_NEXT_KEY, type VapNextConfig } from '@vritti/vap-sdk/payload';

export type { VapNextConfig };
export { VAP_NEXT_KEY };

/**
 * The CMS half of the Next actions — Payload's, and the only part of this tier that is.
 *
 * Everything else here is framework glue: the `'use server'` boundary, `cookies()`, `redirect()`,
 * `revalidatePath()`. Those are what make these server actions at all, and they are the same for any
 * CMS behind them. **This file is the seam.** A second CMS gets its own adapter exporting the same
 * three functions, and the actions pick one — rather than a parallel `strapi/auth` re-deriving the
 * cookie and redirect handling.
 */

/**
 * The running Payload instance, without the app handing one over.
 *
 * `getPayload` refuses to run without a config object, and a package cannot import the app's —
 * `@payload-config` is a path alias in the app's own tsconfig, which bundlers do not apply inside
 * `node_modules`. So this reads the instance Payload itself caches: `global._payload` is a Map keyed
 * by `options.key ?? 'default'`, which is how Payload avoids re-initialising across calls and how it
 * survives HMR.
 *
 * That is an internal of Payload rather than a published API, so it is guarded: if the cache is cold
 * this throws something that names the cause, instead of failing later as a null dereference.
 */
export async function resolvePayload(): Promise<PayloadLike> {
  const cache = (globalThis as { _payload?: Map<string, { payload?: unknown; promise?: unknown }> })
    ._payload;
  const entry = cache?.get('default');
  const instance = entry?.payload ?? (entry?.promise ? await entry.promise : undefined);

  if (!instance) {
    throw new Error(
      'Vritti: Payload is not initialised yet, so a vap-sdk Next action cannot reach it. This only ' +
        'happens when a server action is the very first request a fresh process handles. Render any ' +
        'page first, or wire the action through your own thin `use server` wrapper that calls ' +
        'getPayload({ config }) itself.',
    );
  }
  return instance as PayloadLike;
}

/** The app's own settings, read from `payload.config.custom` where `vap({ auth })` put them. */
export function vapNextConfig(payload: PayloadLike): VapNextConfig {
  const custom = (payload as unknown as { config?: { custom?: Record<string, unknown> } }).config
    ?.custom;
  const config = custom?.[VAP_NEXT_KEY] as VapNextConfig | undefined;

  if (!config?.routes) {
    throw new Error(
      'Vritti: vap-sdk Next actions need `vap({ auth: { routes: { code, name, login, home } } })` ' +
        'in your payload config.',
    );
  }
  return config;
}

/** The editor's wording, or undefined so the SDK's defaults stand. */
export async function vapNextMessages(
  payload: PayloadLike,
  slug: string | undefined,
): Promise<OtpMessages | undefined> {
  if (!slug) return undefined;
  const findGlobal = (payload as unknown as {
    findGlobal?: (args: { slug: string; depth?: number }) => Promise<{ messages?: OtpMessages }>;
  }).findGlobal;
  if (!findGlobal) return undefined;
  try {
    return (await findGlobal.call(payload, { slug, depth: 0 })).messages;
  } catch {
    // A missing or unreadable global is not worth failing a sign-in over — the defaults are English.
    return undefined;
  }
}
