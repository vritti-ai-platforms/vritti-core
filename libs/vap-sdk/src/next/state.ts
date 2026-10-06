import { VapError } from '@vritti/vap-sdk';
import type { PayloadLike } from '@vritti/vap-sdk/payload';

/** What a party-facing action hands back to a form. */
export type PartyActionState = {
  error?: string;
  /** Names the input to highlight and focus. */
  field?: string;
  /** Something that is not a failure — "already in your wishlist". */
  message?: string;
  /** Set on success so a button can confirm without the page saying what changed. */
  ok?: boolean;
};

/** One trimmed field. Empty means absent, which every caller below treats as "nothing to do". */
export const formField = (data: FormData, key: string) =>
  (data.get(key) ?? '').toString().trim();

/**
 * Where the party was, so a sign-in redirect can bring them back and the right route revalidates.
 *
 * Submitted by the form rather than read from a header: a server action has no URL of its own — it
 * runs on a POST to whatever route invoked it — so the page has to say where it was.
 */
export const returnToFrom = (data: FormData) => formField(data, 'returnTo') || '/';

/**
 * Runs one party operation and turns a core failure into something readable.
 *
 * The callback returns the state to show, so an outcome that is neither success nor failure —
 * "already in your wishlist" — has a way out. Returning a fixed `{ ok: true }` here is what
 * swallowed that the first time.
 */
export async function withPartyErrors(
  payload: PayloadLike,
  run: () => Promise<PartyActionState>,
): Promise<PartyActionState> {
  try {
    return await run();
  } catch (error) {
    // Thrown by redirect() and notFound(); rethrowing is what lets the navigation happen.
    if (error && typeof error === 'object' && 'digest' in error) throw error;

    payload.logger?.error({ err: error }, 'A party action failed');

    if (error instanceof VapError) {
      /**
       * A misconfigured storefront is not a party's problem to retry.
       *
       * `Not Configured` means a credential or the selling currency is missing — a deploy mistake
       * that will fail identically forever. Rethrowing surfaces it as a real error instead of
       * disguising it as "try again in a moment".
       */
      if (error.code === 'Not Configured') throw error;

      // Everything else VapError carries is written to be read by whoever asked — a delisted item,
      // a quantity out of range, "the store is unavailable" for a 5xx. Surfaced rather than
      // replaced, so the next failure names itself.
      return { error: error.message };
    }

    // Not from core at all — a bug here, or the network. Nothing a party can act on.
    return { error: 'We could not do that just now. Try again in a moment.' };
  }
}
