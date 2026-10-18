export class VapError extends Error {
  constructor(
    message: string,
    readonly code: string | undefined,
    readonly status: number | undefined,
  ) {
    super(message);
    this.name = 'VapError';
  }
}

export class PartyRollbackError extends Error {
  constructor(
    readonly localId: string | number,
    readonly cause: unknown,
    readonly rollbackError: unknown,
  ) {
    super(
      `Registration failed and the local record ${localId} could not be rolled back — ` +
        'it now exists without a commerce party.',
    );
    this.name = 'PartyRollbackError';
  }
}
