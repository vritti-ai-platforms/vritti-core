export const AUTH_STATUS_EVENTS = {
  SESSION_REVOKED: 'auth-status.session-revoked',
  USER_UPDATED: 'auth-status.user-updated',
  SITE_UPDATED: 'auth-status.site-updated',
  LEGAL_ENTITY_UPDATED: 'auth-status.legal-entity-updated',
  SITE_GROUP_UPDATED: 'auth-status.site-group-updated',
};

export class SessionRevokedEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId?: string, // undefined = all sessions for this user
  ) {}
}

export class UserUpdatedEvent {
  constructor(public readonly userId: string) {}
}

export class SiteUpdatedEvent {
  constructor(public readonly siteId: string) {}
}

export class LegalEntityUpdatedEvent {
  constructor(public readonly legalEntityId: string) {}
}

export class SiteGroupUpdatedEvent {
  constructor(public readonly siteGroupId: string) {}
}
