import { Logger } from '@nestjs/common';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

const logger = new Logger('MetaGraphError');

// Meta Graph's error envelope. `error_user_title` / `error_user_msg` carry the human-readable
// explanation and are the only fields worth showing an operator — `message` is frequently the
// useless generic "Invalid parameter".
interface MetaGraphApiError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
    error_data?: { details?: string };
  };
}

/**
 * Codes that actually mean the stored credential is dead.
 *
 * Deliberately NOT keyed on `type === 'OAuthException'`: that is Meta's catch-all error type and it
 * accompanies ordinary validation failures too (a rejected template button configuration comes back
 * as OAuthException code 100). Treating the type as an auth failure told operators to reconnect a
 * perfectly good account and threw away the real reason.
 */
const TOKEN_ERROR_CODES = new Set([190]);
const TOKEN_ERROR_SUBCODES = new Set([102, 463, 467]);

const TOKEN_REJECTED = {
  label: 'WhatsApp Token Rejected',
  detail:
    'Meta rejected the access token stored for this account. This usually means Vritti was removed from the business portfolio. Use Reconnect on the account to grant access again.',
};

// Rethrows a failed Meta Graph call as an RFC 9457 problem. Unlike the git service's deployment-owned
// token, the WABA token is supplied by the organization, so auth failures ARE the caller's to fix and
// surface as such. Meta's 4xx messages name the actual problem (rejected display name, number in use,
// pending review), so they are forwarded as the detail — they never contain credentials.
export function rethrowMetaGraphError(error: unknown, detail: string): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('WhatsApp request failed.');
  }

  const status = error.response?.status;

  // No response at all — connection refused, DNS failure, or timeout
  if (status === undefined) {
    throw new ServiceUnavailableException({ label: 'WhatsApp Unreachable', detail });
  }

  const upstream = (error.response?.data as MetaGraphApiError | undefined)?.error;
  // error_user_msg first — it is the sentence Meta writes for a human. error_data.details and
  // message are fallbacks, and message alone is often just "Invalid parameter".
  const upstreamDetail = upstream?.error_user_msg ?? upstream?.error_data?.details ?? upstream?.message;

  if (upstream) {
    logger.warn(
      `Meta Graph ${status} — code=${upstream.code ?? '?'} subcode=${upstream.error_subcode ?? '-'} type=${upstream.type ?? '?'} trace=${upstream.fbtrace_id ?? '-'} :: ${upstream.error_user_title ?? ''} ${upstreamDetail ?? ''}`.trim(),
    );
  }

  // A dead token is reported with HTTP 400 as often as 401, so it is caught by code rather than
  // status — but only by the codes that genuinely mean it, never by the OAuthException type
  if (
    (upstream?.code !== undefined && TOKEN_ERROR_CODES.has(upstream.code)) ||
    (upstream?.error_subcode !== undefined && TOKEN_ERROR_SUBCODES.has(upstream.error_subcode))
  ) {
    throw new BadRequestException(TOKEN_REJECTED);
  }

  switch (status) {
    case 401:
    case 403:
      throw new BadRequestException(TOKEN_REJECTED);
    case 404:
      throw new NotFoundException('Not found in the WhatsApp Business Account.');
    default:
      if (status >= 400 && status < 500) {
        throw new BadRequestException({
          // Meta's own title when it wrote one — it names the problem better than a generic label
          label: upstream?.error_user_title ?? 'WhatsApp Request Rejected',
          detail: upstreamDetail ?? detail,
        });
      }
      throw new InternalServerErrorException('WhatsApp request failed.');
  }
}
