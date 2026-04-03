export const AUTH_STATUS_EVENTS = {
  SESSION_REVOKED: 'auth-status.session-revoked',
};

export class SessionRevokedEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId?: string, // undefined = all sessions for this user
  ) {}
}
