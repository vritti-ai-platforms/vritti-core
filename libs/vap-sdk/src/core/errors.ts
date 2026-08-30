
/**
 * A failure the caller should surface.
 *
 * Shared by every domain — an appointment that cannot be booked and an identity
 * that cannot be created come back the same shape, so a caller handles them in
 * one place.
 */
export class VapError extends Error {
  constructor(
    message: string,
    /** Core's error label, e.g. `Unknown Client`. */
    readonly code: string | undefined,
    /** HTTP-equivalent status, when core supplied one. */
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = 'VapError';
  }
}

/**
 * Core refused, **and** undoing the local record failed too.
 *
 * The state this reports is the one worth interrupting for: an account that can
 * sign in with nothing behind it in commerce. The shopper will get all the way to
 * checkout before anything looks wrong, so a caller should log this loudly and
 * tell them to sign in rather than inviting a retry that will now say their email
 * is taken.
 *
 * Distinct from a plain `VapError`, which means core refused and the local record
 * was cleanly removed — nothing left anywhere, safe to retry.
 */
export class PartyRollbackError extends Error {
  constructor(
    /** The local record that could not be removed. */
    readonly localId: string | number,
    /** Why core refused. */
    readonly cause: unknown,
    /** Why the undo failed. */
    readonly rollbackError: unknown,
  ) {
    super(
      `Registration failed and the local record ${localId} could not be rolled back — ` +
        'it now exists without a commerce party.',
    );
    this.name = 'PartyRollbackError';
  }
}
