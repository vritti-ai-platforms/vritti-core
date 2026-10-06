import { Logger } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

const logger = new Logger('Msg91Error');

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

// Rethrows a failed MSG91 call as an RFC 9457 problem
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

// Applies the same treatment to a 200 that carries a failure in its body
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
