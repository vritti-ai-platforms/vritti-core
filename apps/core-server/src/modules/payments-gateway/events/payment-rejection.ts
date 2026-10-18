// Statuses that look like a client error but can clear on their own: auth/context glitches, timeouts, throttling
const TRANSIENT_CLIENT_STATUSES = new Set([401, 403, 408, 425, 429]);

// The HTTP status an error carries, whether it is an HttpException or an RFC 9457 problem relayed over NATS
export function errorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object') return null;
  const candidate = error as { getStatus?: unknown; status?: unknown; statusCode?: unknown };
  if (typeof candidate.getStatus === 'function') {
    const status = (candidate.getStatus as () => unknown)();
    return typeof status === 'number' ? status : null;
  }
  if (typeof candidate.status === 'number') return candidate.status;
  if (typeof candidate.statusCode === 'number') return candidate.statusCode;
  return null;
}

// True when the other side refused the request for good (a 4xx such as Already Paid, Amount Mismatch, Order Not Payable
// or a validation failure), so repeating it can never succeed.
export function isDefinitiveRejection(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === null) return false;
  return status >= 400 && status < 500 && !TRANSIENT_CLIENT_STATUSES.has(status);
}
