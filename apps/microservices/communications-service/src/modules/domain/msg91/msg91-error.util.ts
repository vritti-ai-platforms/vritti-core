import { Logger } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

const logger = new Logger('Msg91Error');

/**
 * MSG91's response envelope — the same shape for success and failure.
 *
 * `type` is the field that matters: MSG91 answers a rejected request with **HTTP 200** and
 * `{ type: 'error' }` as readily as it does with a 4xx, so status alone is not a usable signal.
 * Trusting it would record a dead send as delivered.
 */
export interface Msg91Envelope {
  // /v5/flow and friends
  type?: string;
  message?: string;
  // /v5/sms/* uses an entirely different envelope — verified against a live account
  status?: string;
  hasError?: boolean;
  errors?: unknown;
  data?: unknown;
}

export const MSG91_ERROR = 'error';

// MSG91 says nothing machine-readable about *why* a key was refused — there is no error code, only
// prose — so an auth failure is recognised by status and reported as the one thing an operator can
// act on: the stored key is wrong.
const KEY_REJECTED = {
  label: 'MSG91 key rejected',
  detail:
    'MSG91 rejected the auth key stored for this provider. Check the key in the MSG91 panel and save it again on this provider.',
};

/**
 * Rethrows a failed MSG91 call as an RFC 9457 problem.
 *
 * Like the WhatsApp access token and unlike a deployment-owned secret, the auth key belongs to the
 * organization, so auth failures ARE the caller's to fix and surface as such. MSG91's `message` is
 * short operator-facing prose ("flow id missing", "template not found") and never echoes the key,
 * so it is forwarded as the detail.
 */
export function rethrowMsg91Error(error: unknown, detail: string): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('MSG91 request failed.');
  }

  const status = error.response?.status;

  // No response at all — connection refused, DNS failure, or timeout
  if (status === undefined) {
    throw new ServiceUnavailableException({ label: 'MSG91 unreachable', detail });
  }

  const upstream = error.response?.data as Msg91Envelope | undefined;
  const upstreamDetail = typeof upstream?.message === 'string' ? upstream.message : undefined;

  logger.warn(`MSG91 ${status} — type=${upstream?.type ?? '?'} :: ${upstreamDetail ?? ''}`.trim());

  switch (status) {
    case 401:
    case 403:
      throw new BadRequestException(KEY_REJECTED);
    case 404:
      throw new NotFoundException('Not found in the MSG91 account.');
    default:
      if (status >= 400 && status < 500) {
        throw new BadRequestException({ label: 'MSG91 rejected the request', detail: upstreamDetail ?? detail });
      }
      throw new InternalServerErrorException('MSG91 request failed.');
  }
}

/**
 * Applies the same treatment to a 200 that carries a failure in its body. Separate from the axios
 * path above because nothing threw — the request "succeeded" and the envelope is the only evidence.
 *
 * MSG91 uses two different envelopes depending on the endpoint family, both verified against a live
 * account: `/v5/flow` answers `{type, message}`, while `/v5/sms/*` answers
 * `{status, hasError, errors, data}` — and returns HTTP 200 for a miss either way. Checking only
 * one shape lets the other's failures through as successes.
 */
export function rejectMsg91Envelope(envelope: Msg91Envelope | undefined, fallback: string): void {
  if (!envelope) return;

  const failed = envelope.type === MSG91_ERROR || envelope.hasError === true || envelope.status === MSG91_ERROR;
  if (!failed) return;

  const detail = firstString(envelope.errors) ?? firstString(envelope.message) ?? fallback;
  logger.warn(`MSG91 200 with a failed envelope :: ${detail}`);
  throw new BadRequestException({ label: 'MSG91 rejected the request', detail });
}

// `errors` arrives as a string on failure and an empty array on success, so it is narrowed rather
// than assumed
function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  if (Array.isArray(value)) return value.find((entry): entry is string => typeof entry === 'string' && !!entry);
  return undefined;
}
