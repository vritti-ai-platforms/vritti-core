/**
 * The contract between `vap()` and the ready-made Next actions.
 *
 * Lives on this side rather than in `src/next` so the plugin can reference it without dragging the
 * Next tier into the CommonJS build — two tsconfigs emitting into `dist/next` collide, and the
 * symptom is an opaque "would overwrite input file".
 */
export const VAP_NEXT_KEY = 'vapNext';

export type VapNextConfig = {
  /** Where each step of the sign-in lives in this app. */
  routes: {
    /**
     * The sign-in screen. All three steps render here — which one is read from the sealed cookie,
     * so there is no per-step route to configure and none to drift.
     */
    login: string;
    /** Where a sign-in lands when the party had no particular destination. */
    home: string;
    /** Defaults to `/account`. */
    account?: string;
    /** Defaults to `/account/addresses`. */
    addresses?: string;
  };
  /** Two storefronts on sibling subdomains must not share one. */
  cookieName?: string;
  /** Payload global holding the editor's wording for each refusal. */
  messagesGlobal?: string;
  /** The auth-enabled collection holding the app's party rows. Defaults to `parties`. */
  collection?: string;
};
