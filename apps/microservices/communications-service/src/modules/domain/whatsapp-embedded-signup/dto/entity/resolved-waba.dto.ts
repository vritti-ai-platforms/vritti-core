// Raw WhatsApp Business Account node as Meta Graph returns it. `owner_business_info` is the
// customer's Business Portfolio and needs `business_management` advanced access on the app.
export interface MetaGraphWaba {
  id: string;
  name?: string;
  account_review_status?: string;
  owner_business_info?: { id?: string; name?: string };
  on_behalf_of_business_info?: { id?: string; name?: string };
}

// Everything a connect needs, resolved from Meta rather than typed by the user. Carries the minted
// access token, so it stays inside this service — it is never returned through a message pattern.
export class ResolvedWabaDto {
  wabaId: string;
  metaBusinessId: string;
  name: string;
  accessToken: string;
  accountReviewStatus: string | null;

  static from(raw: MetaGraphWaba, accessToken: string, metaBusinessId: string): ResolvedWabaDto {
    const dto = new ResolvedWabaDto();
    dto.wabaId = raw.id;
    dto.metaBusinessId = metaBusinessId;
    // Meta always names a WABA, but fall back to the id rather than writing an empty NOT NULL column
    dto.name = raw.name?.trim() || raw.id;
    dto.accessToken = accessToken;
    dto.accountReviewStatus = raw.account_review_status ?? null;
    return dto;
  }
}
