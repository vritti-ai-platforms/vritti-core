export const AUTH_STATUS_EVENTS = {
  SESSION_REVOKED: 'auth-status.session-revoked',
  USER_UPDATED: 'auth-status.user-updated',
  BU_UPDATED: 'auth-status.bu-updated',
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

export class BuUpdatedEvent {
  constructor(public readonly buId: string) {}
}
