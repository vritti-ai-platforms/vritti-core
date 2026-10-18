import { VapError } from './errors.js';
import type { ResponseCacheStore } from './transport/response-cache-store.js';

export type VapSdkConfig = {
  endpoint: string;

  clientId: string;
  clientSecret: string;

  siteId?: string;
  legalEntityId?: string;

  siteTypes?: string[];

  fetch?: typeof fetch;

  responseCache?: ResponseCacheStore;
};

export type RequestContext = {
  partyId?: string;

  siteId?: string | null;

  legalEntityId?: string | null;
};

export type SdkContext = RequestContext & {
  currencyCode?: string;
};

// The context an ORG-level operation sends: who it acts for, and no workspace.
export function withoutWorkspace({ partyId }: RequestContext): RequestContext {
  return partyId ? { partyId } : {};
}

export type WorkspaceScope = 'org' | 'le' | 'site';

// The context for a request made at `scope`: the party, plus only the workspace header that scope names.
export function contextForScope(context: RequestContext, scope: WorkspaceScope): RequestContext {
  const base = withoutWorkspace(context);
  if (scope === 'org') return base;

  const id = scope === 'site' ? context.siteId : context.legalEntityId;
  if (!id) {
    const setting = scope === 'site' ? 'siteId' : 'legalEntityId';
    throw new VapError(
      `A ${scope}-scoped request needs \`${setting}\` — set it on createVapSdk or pass it to forContext.`,
      'Not Configured',
      undefined,
    );
  }
  return scope === 'site' ? { ...base, siteId: id } : { ...base, legalEntityId: id };
}

export type Money = {
  currency: string;
  value: string;
};

export const OTP_CHANNELS = { WHATSAPP: 'whatsapp', SMS: 'sms' } as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];

export type SendOtpResult = {
  sent: boolean;
  expiresAt: string;
  resendAvailableAt: string;
  codeLength: number;
};
