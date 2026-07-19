import { UserRoleDomainService } from '@domain/user-role/services/user-role.service';
import { Injectable, Logger, type MessageEvent } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AUTH_STATUS_EVENTS,
  type LegalEntityUpdatedEvent,
  type OrgUpdatedEvent,
  type SessionRevokedEvent,
  type SiteGroupUpdatedEvent,
  type SiteUpdatedEvent,
  type UserUpdatedEvent,
} from '@/common/events/auth-status.events';
import { AuthService } from '../services/auth.service';
import { AuthStatusSseService } from '../services/auth-status-sse.service';

@Injectable()
export class AuthStatusEventListener {
  private readonly logger = new Logger(AuthStatusEventListener.name);

  constructor(
    private readonly authService: AuthService,
    private readonly sseService: AuthStatusSseService,
    private readonly userRoleService: UserRoleDomainService,
  ) {}

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

  // Rebuilds and re-pushes fresh auth-state to all live connections of the updated user
  @OnEvent(AUTH_STATUS_EVENTS.USER_UPDATED)
  async handleUserUpdated(event: UserUpdatedEvent) {
    this.logger.log(`Handling USER_UPDATED for user ${event.userId}`);
    await this.rePushToUser(event.userId);
  }

  // Rebuilds and re-pushes fresh auth-state to all users assigned to the updated site
  @OnEvent(AUTH_STATUS_EVENTS.SITE_UPDATED)
  async handleSiteUpdated(event: SiteUpdatedEvent) {
    this.logger.log(`Handling SITE_UPDATED for sites ${event.siteId}`);

    const assignments = await this.userRoleService.findBySite(event.siteId);
    const userIds = [...new Set(assignments.map((a) => a.userId))];

    for (const userId of userIds) {
      await this.rePushToUser(userId);
    }
  }

  // Rebuilds and re-pushes fresh auth-state to the org's assigned users when a legal entity changes
  @OnEvent(AUTH_STATUS_EVENTS.LEGAL_ENTITY_UPDATED)
  async handleLegalEntityUpdated(event: LegalEntityUpdatedEvent) {
    this.logger.log(`Handling LEGAL_ENTITY_UPDATED for legal entity ${event.legalEntityId}`);
    await this.rePushToOrg(event.orgId);
  }

  // Rebuilds and re-pushes fresh auth-state to the org's assigned users when a site group changes
  @OnEvent(AUTH_STATUS_EVENTS.SITE_GROUP_UPDATED)
  async handleSiteGroupUpdated(event: SiteGroupUpdatedEvent) {
    this.logger.log(`Handling SITE_GROUP_UPDATED for site group ${event.siteGroupId}`);
    await this.rePushToOrg(event.orgId);
  }

  // Rebuilds and re-pushes fresh auth-state to the org's assigned users when the org itself changes (e.g. feature locks)
  @OnEvent(AUTH_STATUS_EVENTS.ORG_UPDATED)
  async handleOrgUpdated(event: OrgUpdatedEvent) {
    this.logger.log(`Handling ORG_UPDATED for org ${event.orgId}`);
    await this.rePushToOrg(event.orgId);
  }

  // Re-pushes fresh auth-state to every user holding an assignment in the org
  private async rePushToOrg(orgId: string) {
    const userIds = await this.userRoleService.findUserIdsForOrg(orgId);
    for (const userId of userIds) {
      await this.rePushToUser(userId);
    }
  }

  // Rebuilds the per-connection auth-state and pushes it to each of the user's live sessions
  private async rePushToUser(userId: string) {
    for (const conn of this.sseService.getConnections(userId)) {
      try {
        const state = await this.authService.buildAuthStateForUser(userId, conn.orgId, conn.platform);
        state.sessionId = conn.sessionId;
        this.sseService.sendToSession(userId, conn.sessionId, {
          type: 'auth-state',
          data: JSON.stringify(state),
        });
      } catch (error) {
        this.logger.error(`Failed to re-push auth-state for user ${userId}, session ${conn.sessionId}: ${error}`);
      }
    }
  }
}
