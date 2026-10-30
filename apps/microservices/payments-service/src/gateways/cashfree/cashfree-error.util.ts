import { Logger } from '@nestjs/common';
import {
  BadGatewayException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  TooManyRequestsException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

const logger = new Logger('CashfreeError');

export interface CashfreeErrorBody {
  message?: string;
  code?: string;
  type?: string;
}

export interface CashfreeErrorContext {
  detail: string;
  // The form field the merchant's secret is entered on, when the call is a credential probe — a rejected key then
  // lands inline on that field rather than as a page-level alert
  credentialField?: string;
}

const CREDENTIALS_REJECTED_DETAIL =
  'Cashfree rejected the app id and secret key stored for this gateway. Check them in the Cashfree dashboard and save them again.';

// Rethrows a failed Cashfree call as an RFC 9457 problem. The key pair belongs to the merchant, so an auth failure
// is theirs to fix and surfaces as a 400 — never a 401, which the web client would read as its own session
// expiring. Only status, code and message are logged; the request headers (which carry the secret) are never touched.
export function rethrowCashfreeError(error: unknown, context: CashfreeErrorContext): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('Payment gateway request failed.');
  }

  const status = error.response?.status;

  // No response at all — connection refused, DNS failure, or timeout
  if (status === undefined) {
    throw new ServiceUnavailableException({ label: 'Gateway Unreachable', detail: context.detail });
  }

  const upstream = error.response?.data as CashfreeErrorBody | undefined;
  logger.warn(
    `Cashfree ${status} — code=${upstream?.code ?? '?'} type=${upstream?.type ?? '-'} :: ${upstream?.message ?? ''}`.trim(),
  );

  switch (status) {
    case 401:
    case 403:
      throw new BadRequestException({
        label: 'Gateway Rejected Credentials',
        detail: CREDENTIALS_REJECTED_DETAIL,
        ...(context.credentialField
          ? { errors: [{ field: context.credentialField, message: 'Rejected by Cashfree' }] }
          : {}),
      });
    case 404:
      throw new NotFoundException('Not found at the payment gateway.');
    case 429:
      throw new TooManyRequestsException({
        label: 'Gateway Rate Limited',
        detail: 'Cashfree is throttling requests for this account. Please try again shortly.',
      });
    default:
      if (status >= 400 && status < 500) {
        throw new BadRequestException({
          label: 'Gateway Rejected Request',
          detail: upstream?.message ?? context.detail,
        });
      }
      throw new BadGatewayException({
        label: 'Gateway Error',
        detail: 'Cashfree could not process the request. Please try again.',
      });
  }
}

// The HTTP status of a failed call, when the gateway answered at all
export function cashfreeErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

// Returns the message of a failed call's error body, lower-cased, when the gateway answered with one
export function cashfreeErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  return (error.response?.data as CashfreeErrorBody | undefined)?.message?.toLowerCase();
}
