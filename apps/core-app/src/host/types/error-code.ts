// Client-side mirror of the server's machine-readable error contract
// (api-sdk: src/filters/error-code.ts). The server surfaces these on the wire as
// GraphQL `extensions.code`; the Apollo errorLink branches on them. Keep the values
// in lockstep with the server enum — add a value here only when it exists there.
export const ErrorCode = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
