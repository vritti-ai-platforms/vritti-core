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

const logger = new Logger('HdfcRazorpayError');

export interface HdfcRazorpayErrorBody {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    field?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export interface HdfcRazorpayErrorContext {
  detail: string;
  // The form field the merchant's secret is entered on, when the call is a credential probe — a
  // rejected key then lands inline on that field rather than as a page-level alert
  credentialField?: string;
  // Razorpay's field path (e.g. `settlements.ifsc_code`) → the caller's input key (e.g. `bank.ifscCode`),
  // so a rejected value lands inline on the form field it came from
  fieldMap?: Readonly<Record<string, string>>;
}

const CREDENTIALS_REJECTED_DETAIL =
  'Razorpay rejected the key id and secret stored for this gateway. Check them in the Razorpay dashboard and save them again.';

// Rethrows a failed HDFC Razorpay call as an RFC 9457 problem; HDFC's own copy, so its error codes can diverge.
// The key pair belongs to the merchant, so an
// auth failure is theirs to fix and surfaces as a 400 — never a 401, which the web client would read
// as its own session expiring. Only status, code and description are logged; the request config
// (which carries the basic-auth pair) is never touched.
export function rethrowHdfcRazorpayError(error: unknown, context: HdfcRazorpayErrorContext): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('Payment gateway request failed.');
  }

  const status = error.response?.status;

  // No response at all — connection refused, DNS failure, or timeout
  if (status === undefined) {
    throw new ServiceUnavailableException({ label: 'Gateway Unreachable', detail: context.detail });
  }

  const upstream = (error.response?.data as HdfcRazorpayErrorBody | undefined)?.error;
  logger.warn(
    `Razorpay ${status} — code=${upstream?.code ?? '?'} reason=${upstream?.reason ?? '-'} field=${upstream?.field ?? '-'} :: ${upstream?.description ?? ''}`.trim(),
  );

  switch (status) {
    case 401:
    case 403:
      throw new BadRequestException({
        label: 'Gateway Rejected Credentials',
        detail: CREDENTIALS_REJECTED_DETAIL,
        ...(context.credentialField
          ? { errors: [{ field: context.credentialField, message: 'Rejected by Razorpay' }] }
          : {}),
      });
    case 404:
      throw new NotFoundException('Not found at the payment gateway.');
    case 429:
      throw new TooManyRequestsException({
        label: 'Gateway Rate Limited',
        detail: 'Razorpay is throttling requests for this account. Please try again shortly.',
      });
    default:
      if (status >= 400 && status < 500) {
        const field = mapUpstreamField(upstream?.field, context.fieldMap);
        throw new BadRequestException({
          label: 'Gateway Rejected Request',
          detail: upstream?.description ?? context.detail,
          ...(field ? { errors: [{ field, message: 'Rejected by Razorpay' }] } : {}),
        });
      }
      throw new BadGatewayException({
        label: 'Gateway Error',
        detail: 'Razorpay could not process the request. Please try again.',
      });
  }
}

// Resolves Razorpay's field path to the caller's input key; an unmapped field stays page-level
function mapUpstreamField(
  field: string | null | undefined,
  fieldMap: Readonly<Record<string, string>> | undefined,
): string | undefined {
  if (!field || !fieldMap) return undefined;
  return fieldMap[field];
}
