import { Injectable, Logger, type MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AUTH_STATUS_EVENTS, SessionRevokedEvent } from '../events/auth-status.events';
import { AuthStatusSseService } from '../services/auth-status-sse.service';

@Injectable()
export class AuthStatusEventListener {
  private readonly logger = new Logger(AuthStatusEventListener.name);

  constructor(private readonly sseService: AuthStatusSseService) {}

  // Pushes auth-state { isAuthenticated: false } to the revoked session or all sessions
  @OnEvent(AUTH_STATUS_EVENTS.SESSION_REVOKED)
  handleSessionRevoked(event: SessionRevokedEvent) {
    this.logger.log(
      `Handling SESSION_REVOKED for user ${event.userId}${event.sessionId ? `, session ${event.sessionId}` : ' (all sessions)'}`,
    );

    const message: MessageEvent = {
      type: 'auth-state',
      data: JSON.stringify({ isAuthenticated: false }),
    };

    if (event.sessionId) {
      this.sseService.sendToSession(event.userId, event.sessionId, message);
    } else {
      this.sseService.sendToUser(event.userId, message);
    }
  }
}
