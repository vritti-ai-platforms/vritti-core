import type { OtpFlowData, OtpMessages, OtpStep } from '../core/flows/auth.js';
import type { OtpChannel } from '../core/types.js';
import { open, type SealedState, seal, sealedExpiry } from '../server/sealed-cookie.js';
import { getSdk, type PayloadLike } from './runtime.js';
import { issueSessionToken } from './session-token.js';

export interface SealedOtpFlow extends OtpFlowData, SealedState {}

export type OtpActionState = {
  error?: string;
  field?: string;
};

export type LocalParty = { id: string | number; partyId?: string | null };

export type OtpSignInPorts = {
  readCookie: (name: string) => Promise<string | undefined> | string | undefined;
  writeCookie: (
    name: string,
    value: string,
    options: { httpOnly: true; sameSite: 'strict'; path: '/'; maxAge?: number; expires?: Date; secure: boolean },
  ) => Promise<void> | void;
  clearCookie: (name: string) => Promise<void> | void;
  redirect: (to: string) => never;
  isSecure: () => Promise<boolean> | boolean;
};

export type OtpSignInRoutes = {
  login: string;
  home: string;
};

export type OtpSignInOptions<L extends LocalParty = LocalParty> = {
  payload: PayloadLike;
  ports: OtpSignInPorts;
  routes: OtpSignInRoutes;
  collection?: string;
  cookieName?: string;
  ttlMs?: number;
  messages?: () => Promise<OtpMessages | undefined> | OtpMessages | undefined;
  hooks?: Partial<{
    findLocal: (phone: string) => Promise<L | null>;
    createLocal: (party: { partyId: string; phone: string; displayName: string | null }) => Promise<L>;
    linkLocal: (local: L, partyId: string) => Promise<void>;
  }>;
  onError?: (error: unknown, context: string) => void;
};

const DEFAULT_TTL_MS = 10 * 60 * 1000;

// An OTP sign-in, assembled — cookie, redirects, session and all.
export function createOtpSignInActions<L extends LocalParty = LocalParty>(options: OtpSignInOptions<L>) {
  const { payload, ports, routes, collection = 'parties', cookieName = 'vap-otp', ttlMs = DEFAULT_TTL_MS } = options;

  const hooks = {
    findLocal: async (phone: string): Promise<L | null> => {
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
    createLocal: async (party: { partyId: string; phone: string; displayName: string | null }): Promise<L> =>
      // The name is core's — its display name for a party the organization already knew, or the one the name step just
      // collected.
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
      sameSite: 'strict',
      path: '/',
      maxAge: Math.floor(ttlMs / 1000),
      secure: await ports.isSecure(),
    });
  };

  // The parked state, or null when it lapsed, was never started, or was tampered with.
  const parked = async (): Promise<SealedOtpFlow | null> =>
    open<SealedOtpFlow>(await ports.readCookie(cookieName), payload.secret);

  // Resolves the party, finds or creates the local account, sets the session, discards the flow.
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

  // Turns an outcome into a navigation, a parked cookie, or a message for the form.
  const act = async (
    outcome: Awaited<ReturnType<typeof auth.startOtpSignIn>>,
    said: OtpMessages | undefined,
  ): Promise<OtpActionState> => {
    if (outcome.status === 'error') return { error: outcome.error, field: outcome.field };

    if (outcome.status === 'flow') {
      await park(outcome.flow);
      // One destination for every step: the page reads which form to show from the cookie just parked, so there is
      // nothing to put in the URL and nothing for it to contradict.
      return ports.redirect(routes.login);
    }

    if (!(await signIn(outcome))) {
      return { error: said?.unavailable || 'We could not sign you in just now. Try again in a moment.' };
    }
    // Back where they were when they were asked to sign in.
    return ports.redirect(outcome.returnTo || routes.home);
  };

  return {
    // Step one — send a code to the number on the form.
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

    // Step two — check the code, and sign in whoever the number already belongs to.
    async verify(_previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
      const said = await messages();
      return act(await auth.submitOtpCode(await parked(), str(formData, 'code'), said), said);
    },

    // Step three — name a first-time party, then sign them in.
    async complete(_previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
      const said = await messages();
      return act(auth.submitOtpName(await parked(), str(formData, 'name'), said), said);
    },

    // Abandons the flow, so a mistyped number is one click to fix.
    async restart(): Promise<never> {
      await ports.clearCookie(cookieName);
      return ports.redirect(routes.login);
    },

    // Which form to render, read from the parked state.
    async step(): Promise<OtpStep> {
      return auth.stepFromFlow(await parked());
    },

    current: parked,
  };
}

export type OtpSignInActions = ReturnType<typeof createOtpSignInActions>;
