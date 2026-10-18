import { VapError } from '@vritti/vap-sdk';
import type { PayloadLike } from '@vritti/vap-sdk/payload';

export type PartyActionState = {
  error?: string;
  field?: string;
  message?: string;
  ok?: boolean;
};

// One trimmed field.
export const formField = (data: FormData, key: string) => (data.get(key) ?? '').toString().trim();

// Where the party was, so a sign-in redirect can bring them back and the right route revalidates.
export const returnToFrom = (data: FormData) => formField(data, 'returnTo') || '/';

// Runs one party operation and turns a core failure into something readable.
export async function withPartyErrors<S extends object = PartyActionState>(
  payload: PayloadLike,
  run: () => Promise<S>,
): Promise<S> {
  try {
    return await run();
  } catch (error) {
    // Thrown by redirect() and notFound(); rethrowing is what lets the navigation happen.
    if (error && typeof error === 'object' && 'digest' in error) throw error;

    payload.logger?.error({ err: error }, 'A party action failed');

    if (error instanceof VapError) {
      // A misconfigured storefront is not a party's problem to retry.
      if (error.code === 'Not Configured') throw error;

      // Everything else VapError carries is written to be read by whoever asked — a delisted item, a quantity out of
      // range, "the store is unavailable" for a 5xx.
      return { error: error.message } as S;
    }

    // Not from core at all — a bug here, or the network.
    // Not from core at all — a bug here, or the network. Nothing a party can act on.
    return { error: 'We could not do that just now. Try again in a moment.' } as S;
  }
}
