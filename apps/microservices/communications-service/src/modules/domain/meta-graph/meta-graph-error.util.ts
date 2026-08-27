import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

// Meta Graph reports failures as { error: { message, type, code, error_data: { details } } }
interface MetaGraphApiError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_data?: { details?: string };
  };
}

const TOKEN_REJECTED = {
  label: 'WhatsApp Token Rejected',
  detail:
    'Meta rejected the access token stored for this account. Reconnect the account with a valid system-user token that has the whatsapp_business_management permission.',
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
  const upstreamDetail = upstream?.error_data?.details ?? upstream?.message;

  // Meta reports expired/invalidated tokens (OAuthException, code 190 — "session is invalid",
  // "session has expired") with HTTP 400 as often as 401, so catch them by error type rather
  // than status and surface the actionable reconnect message instead of Meta's raw session text
  if (upstream?.code === 190 || upstream?.type === 'OAuthException') {
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
          label: 'WhatsApp Request Rejected',
          detail: upstreamDetail ?? detail,
        });
      }
      throw new InternalServerErrorException('WhatsApp request failed.');
  }
}
