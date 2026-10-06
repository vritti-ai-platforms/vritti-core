import type { OtpFlowData, OtpMessages, OtpStep } from '../core/flows/auth';
import type { OtpChannel } from '../core/types';
import { open, seal, type SealedState, sealedExpiry } from '../server/sealed-cookie';
import { getSdk, type PayloadLike } from './runtime';
import { issueSessionToken } from './session-token';

/** The flow state as it is parked: the shape from `core/flows/auth` plus its own expiry. */
export interface SealedOtpFlow extends OtpFlowData, SealedState {}

/** What a step hands back to a form. A successful submit never returns — it redirects. */
export type OtpActionState = {
  error?: string;
  /** Names the input to highlight and focus. */
  field?: string;
};

/**
 * The app's own account record for a party.
 *
 * `partyId` is read by the default `linkLocal` to skip a write that would change nothing. An app
 * with a differently-shaped row supplies its own hooks and its own type.
 */
export type LocalParty = { id: string | number; partyId?: string | null };

/**
 * The three things only the framework can do.
 *
 * A server action has no request object — it reads an ambient cookie store and signals a navigation
 * by throwing — so these cannot be expressed as the `Response` objects the rest of this tier
 * returns. Handed in rather than imported so this package stays free of Next, the way every other
 * module in it is: a caller writes three one-line functions and this owns everything after.
 */
export type OtpSignInPorts = {
  readCookie: (name: string) => Promise<string | undefined> | string | undefined;
  writeCookie: (
    name: string,
    value: string,
    options: { httpOnly: true; sameSite: 'strict'; path: '/'; maxAge?: number; expires?: Date; secure: boolean },
  ) => Promise<void> | void;
  clearCookie: (name: string) => Promise<void> | void;
  /** Must not return — Next's `redirect` throws, and these actions rely on that. */
  redirect: (to: string) => never;
  /** Whether this response is over TLS, for the cookies' Secure flag. */
  isSecure: () => Promise<boolean> | boolean;
};

export type OtpSignInRoutes = {
  /** The sign-in screen. Every step renders here; which one comes from the sealed cookie. */
  login: string;
  /** Where a sign-in lands when the party had no particular destination. */
  home: string;
};

export type OtpSignInOptions<L extends LocalParty = LocalParty> = {
  payload: PayloadLike;
  ports: OtpSignInPorts;
  routes: OtpSignInRoutes;
  /** The auth-enabled collection holding the app's party rows. */
  collection?: string;
  cookieName?: string;
  /** Long enough to read a message and type six digits; short enough to be worthless if stolen. */
  ttlMs?: number;
  /** Read per request, so an editor's wording is picked up without a deploy. */
  messages?: () => Promise<OtpMessages | undefined> | OtpMessages | undefined;
  /**
   * How the app's own party row is found, made and joined up.
   *
   * **Optional, and omitting it is the normal case.** This package ships the `parties` collection
   * these three queries run against — it defines `phone`, `name` and `partyId` — so defaulting them
   * is not a guess about an app's schema, it is the schema. Every storefront used to carry the same
   * twenty lines of `payload.find`/`create`/`update`.
   *
   * Pass any subset to override; the rest keep the defaults. An app whose rows look different —
   * a different collection shape, a soft-delete, an extra tenant column — supplies its own and
   * types them with `L`.
   */
  hooks?: Partial<{
    /** The app's account for this number, oldest first, or null to create one. */
    findLocal: (phone: string) => Promise<L | null>;
    createLocal: (party: { partyId: string; phone: string; displayName: string | null }) => Promise<L>;
    linkLocal: (local: L, partyId: string) => Promise<void>;
  }>;
  /** Told when a sign-in fails for a reason the party cannot act on. */
  onError?: (error: unknown, context: string) => void;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;

/**
 * An OTP sign-in, assembled — cookie, redirects, session and all.
 *
 * `core/flows/otpSignIn` decides what each step *means*; this carries those decisions out in the one
 * way a Payload app does it. What it owns is exactly the glue that is easy to get wrong and invisible
 * when you do: sealing the flow so `verified` cannot be forged, `httpOnly` and `SameSite=Strict` on
 * the cookie, deleting it the moment a session exists, and doing all of that in an order where no
 * window leaves a half-signed-in party.
 *
 * ## Using it from a `'use server'` module
 *
 * The factory returns an object, and **a `'use server'` file may export only async functions** — one
 * `export const` there strips every export from the module. So keep the object module-local and
 * export thin wrappers:
 *
 * ```ts
 * 'use server'
 * const otp = createOtpSignInActions({ ... })
 *
 * export async function requestOtpAction(p: OtpActionState, f: FormData) { return otp.request(p, f) }
 * export async function verifyOtpAction(p: OtpActionState, f: FormData)  { return otp.verify(p, f) }
 * export async function completeOtpAction(p: OtpActionState, f: FormData) { return otp.complete(p, f) }
 * export async function restartOtpAction() { return otp.restart() }
 * ```
 *
 * Each takes `(previousState, formData)` because that is `useActionState`'s contract.
 */
export function createOtpSignInActions<L extends LocalParty = LocalParty>(
  options: OtpSignInOptions<L>,
) {
  const {
    payload,
    ports,
    routes,
    collection = 'parties',
    cookieName = 'vap-otp',
    ttlMs = DEFAULT_TTL_MS,
  } = options;

  /**
   * The three hooks, defaulted against the collection this package ships.
   *
   * `findLocal` sorts oldest-first deliberately: one number legitimately belongs to more than one
   * row — the same person having signed up twice — and picking consistently is what stops somebody
   * landing in a different account each time they sign in.
   */
  const hooks = {
    findLocal: async (phone: string): Promise<L | null> => {
      // `PayloadLike.find` omits `sort` on purpose: declaring it there makes the interface
      // unassignable from Payload's own `BasePayload`, whose `collection` is a literal union of the
      // app's slugs rather than `string`. Widened here, where it is one call, instead of loosening
      // a type every consumer passes its real Payload instance to.
      const find = payload.find as (args: {
        collection: string;
        where?: unknown;
        limit?: number;
        depth?: number;
        sort?: string;
      }) => Promise<{ docs: unknown[] }>;

      const { docs } = await find({
        collection,
        where: { phone: { equals: phone } },
        sort: 'createdAt',
        limit: 1,
        depth: 0,
      });
      return (docs[0] as L | undefined) ?? null;
    },
    createLocal: async (party: {
      partyId: string;
      phone: string;
      displayName: string | null;
    }): Promise<L> =>
      // The name is core's — its display name for a party the organization already knew, or the one
      // the name step just collected.
      (await payload.create({
        collection,
        data: { phone: party.phone, partyId: party.partyId, name: party.displayName ?? '' },
      })) as L,
    linkLocal: async (local: L, partyId: string): Promise<void> => {
      if (local.partyId === partyId) return;
      await payload.update({ collection, id: local.id, data: { partyId } });
    },
    ...options.hooks,
  };

  const auth = getSdk(payload).auth;
  const str = (data: FormData, key: string) => (data.get(key) ?? '').toString().trim();
  const messages = async () => (options.messages ? await options.messages() : undefined);

  const park = async (state: OtpFlowData): Promise<void> => {
    const sealed: SealedOtpFlow = { ...state, expiresAt: sealedExpiry(ttlMs) };
    await ports.writeCookie(cookieName, seal(sealed, payload.secret), {
      httpOnly: true,
      // The flow never leaves this origin, so nothing needs the cookie sent on a cross-site
      // navigation and the tighter setting costs nothing.
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(ttlMs / 1000),
      secure: await ports.isSecure(),
    });
  };

  /** The parked state, or null when it lapsed, was never started, or was tampered with. */
  const parked = async (): Promise<SealedOtpFlow | null> =>
    open<SealedOtpFlow>(await ports.readCookie(cookieName), payload.secret);

  /**
   * Resolves the party, finds or creates the local account, sets the session, discards the flow.
   *
   * The order is the point. The flow cookie is deleted **after** the session cookie is written, so a
   * failure in between leaves the party able to retry rather than stranded with neither.
   */
  const signIn = async (input: {
    phone: string;
    partyId: string | null;
    displayName: string | null;
    firstName?: string;
  }): Promise<boolean> => {
    try {
      const { local } = await auth.signInWithVerifiedPhone(input, hooks);
      const session = await issueSessionToken({ payload, req: { payload }, collection, user: local });

      await ports.writeCookie(session.name, session.value, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        expires: session.expiresAt,
        secure: await ports.isSecure(),
      });
      await ports.clearCookie(cookieName);
      return true;
    } catch (error) {
      options.onError?.(error, 'signInWithVerifiedPhone');
      return false;
    }
  };

  /** Turns an outcome into a navigation, a parked cookie, or a message for the form. */
  const act = async (
    outcome: Awaited<ReturnType<typeof auth.startOtpSignIn>>,
    said: OtpMessages | undefined,
  ): Promise<OtpActionState> => {
    if (outcome.status === 'error') return { error: outcome.error, field: outcome.field };

    if (outcome.status === 'flow') {
      await park(outcome.flow);
      // One destination for every step: the page reads which form to show from the cookie just
      // parked, so there is nothing to put in the URL and nothing for it to contradict.
      return ports.redirect(routes.login);
    }

    if (!(await signIn(outcome))) {
      return { error: said?.unavailable || 'We could not sign you in just now. Try again in a moment.' };
    }
    // Back where they were when they were asked to sign in. From the sealed state, never the
    // request, so it is the destination validated at step one.
    return ports.redirect(outcome.returnTo || routes.home);
  };

  return {
    /** Step one — send a code to the number on the form. */
    async request(_previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
      const said = await messages();
      return act(
        await auth.startOtpSignIn({
          country: str(formData, 'country'),
          nationalNumber: str(formData, 'nationalNumber'),
          channel: (str(formData, 'channel') || undefined) as OtpChannel | undefined,
          next: str(formData, 'next'),
          messages: said,
        }),
        said,
      );
    },

    /** Step two — check the code, and sign in whoever the number already belongs to. */
    async verify(_previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
      const said = await messages();
      return act(await auth.submitOtpCode(await parked(), str(formData, 'code'), said), said);
    },

    /** Step three — name a first-time party, then sign them in. */
    async complete(_previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
      const said = await messages();
      return act(auth.submitOtpName(await parked(), str(formData, 'name'), said), said);
    },

    /** Abandons the flow, so a mistyped number is one click to fix. */
    async restart(): Promise<never> {
      await ports.clearCookie(cookieName);
      return ports.redirect(routes.login);
    },

    /** Which form to render, read from the parked state. */
    async step(): Promise<OtpStep> {
      return auth.stepFromFlow(await parked());
    },

    /** The parked state, for a page that needs the number or the resend countdown. */
    current: parked,
  };
}

export type OtpSignInActions = ReturnType<typeof createOtpSignInActions>;
