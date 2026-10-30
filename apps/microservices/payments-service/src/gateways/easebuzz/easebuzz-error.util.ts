import { Logger } from '@nestjs/common';
import {
  BadGatewayException,
  InternalServerErrorException,
  ServiceUnavailableException,
  TooManyRequestsException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

const logger = new Logger('EasebuzzError');

// Rethrows a failed Easebuzz call as an RFC 9457 problem. Easebuzz answers its own errors — a bad key, a hash
// mismatch, an unknown transaction — with a 200 and a status flag the transport reads, so what reaches here is the
// connection failing or Easebuzz itself erroring. Only the status is logged: the form carries the merchant key and a
// hash made with the salt
export function rethrowEasebuzzError(error: unknown): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('Payment gateway request failed.');
  }

  const status = error.response?.status;
  if (status === undefined) {
    throw new ServiceUnavailableException({
      label: 'Gateway Unreachable',
      detail: 'Unable to reach Easebuzz. Please try again later.',
    });
  }

  logger.warn(`Easebuzz answered HTTP ${status}`);
  if (status === 429) {
    throw new TooManyRequestsException({
      label: 'Gateway Rate Limited',
      detail: 'Easebuzz is throttling requests for this account. Please try again shortly.',
    });
  }
  throw new BadGatewayException({
    label: 'Gateway Error',
    detail: 'Easebuzz could not process the request. Please try again.',
  });
}
