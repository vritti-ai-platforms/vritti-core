// The failures the checkout helpers report — one `instanceof CheckoutError` catches them all

/** Base of every failure `openCheckout` reports, so one `instanceof` catches them all. */
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * The party closed the modal without paying.
 *
 * Not a failure: nothing was charged and the intent is still open, so opening the same checkout again
 * retries on the same gateway order.
 */
export class CheckoutDismissedError extends CheckoutError {
  constructor() {
    super('The checkout was closed before payment completed.');
    this.name = 'CheckoutDismissedError';
  }
}

/**
 * The gateway declined the attempt — card refused, UPI timed out.
 *
 * The modal is closed when this is raised, so the promise settles once. The intent stays open: open
 * the same checkout again to let them retry.
 */
export class CheckoutFailedError extends CheckoutError {
  constructor(
    /** The gateway's error code, e.g. `BAD_REQUEST_ERROR`. */
    readonly code: string | undefined,
    /** The gateway's sentence for it, written for the payer. */
    readonly description: string | undefined,
    /** The gateway's machine-readable reason, e.g. `payment_failed`. */
    readonly reason?: string,
  ) {
    super(description ?? 'The payment did not go through.');
    this.name = 'CheckoutFailedError';
  }
}
