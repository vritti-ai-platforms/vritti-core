import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { VapError } from '../types';

/**
 * Runs an Apollo operation and rethrows its failures as `VapError`.
 *
 * Every domain operation goes through here, so callers keep matching one error shape regardless of
 * what Apollo threw. That matters beyond tidiness: `register` tolerates a duplicate communication by
 * matching `status === 409` and `code === 'Communication Exists'`, so an unmapped Apollo error would
 * turn a benign conflict into a reported failure.
 */
export async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toCoreError(error);
  }
}

function toCoreError(error: unknown): unknown {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    const extensions = (first?.extensions ?? {}) as { label?: string; code?: string; status?: number };
    return new VapError(
      first?.message ?? 'Something went wrong.',
      extensions.label ?? extensions.code,
      extensions.status,
    );
  }

  // Core is up but failing, or something between us and it is. Either way the caller cannot fix it
  // and the shopper should not read a stack trace.
  if (ServerError.is(error) && error.statusCode >= 500) {
    return new VapError('The store is unavailable right now.', undefined, error.statusCode);
  }

  // A transport failure (DNS, TLS, connection refused) — left as-is so it is not disguised as a
  // response core never sent.
  return error;
}

/**
 * Unwraps a response payload that the types allow to be absent.
 *
 * Apollo types `data` as optional because an errorPolicy of `ignore`/`all` can resolve with errors and
 * no data. This client throws on any GraphQL error, so absent data here means a response that was
 * neither an error nor a result — surfaced as a `VapError` rather than an assertion, so a caller sees
 * the same error shape it handles everywhere else.
 */
export function requireData<T>(data: T | null | undefined): T {
  if (data == null) throw new VapError('Something went wrong.', undefined, undefined);
  return data;
}
