import { MetaGraphHttpService, type MetaGraphTokenDebug } from '@domain/meta-graph/services/meta-graph-http.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type MetaGraphWaba, ResolvedWabaDto } from '../dto/entity/resolved-waba.dto';
import type { ConnectEmbeddedSignupDto } from '../dto/request/connect-embedded-signup.dto';

const WABA_FIELDS = 'id,name,account_review_status,owner_business_info,on_behalf_of_business_info';

// The scope that lets an app manage a WABA's numbers and templates. Meta grants it per asset, so its
// target_ids are the authoritative answer to "does this token control that WABA".
const REQUIRED_SCOPE = 'whatsapp_business_management';

export interface ResolveWabaOptions {
  // A reconnect names the account up front: verified against the grant, never derived from it
  expectedWabaId?: string;
  // WABAs this organization already holds, so an accumulated grant narrows to the new one
  alreadyConnectedWabaIds?: string[];
}

const NOT_GRANTED = {
  label: 'Account not granted',
  detail:
    'The WhatsApp Business Account reported by the signup flow was not granted to Vritti. Please run the connect flow again and make sure the account is selected.',
};

// Raised when the token grants management on several WABAs at once and nothing named which one this
// connect is for. Rare — the flow grants one account — and picking arbitrarily would silently
// connect the wrong business.
const AMBIGUOUS_GRANT = {
  label: 'More than one account to choose from',
  detail:
    'Vritti has access to several WhatsApp Business Accounts that are not connected yet, so it is unclear which one this setup was for. Connect them one at a time, or use Reconnect on the account you meant to refresh.',
};

@Injectable()
export class WhatsappEmbeddedSignupDomainService {
  private readonly logger = new Logger(WhatsappEmbeddedSignupDomainService.name);

  constructor(private readonly metaGraph: MetaGraphHttpService) {}

  // Exchanges the code, establishes which WABA the token actually controls, then reads that WABA's
  // own metadata so name and business portfolio are derived rather than typed
  async resolve(dto: ConnectEmbeddedSignupDto, options: ResolveWabaOptions = {}): Promise<ResolvedWabaDto> {
    const accessToken = await this.metaGraph.exchangeCode(dto.code, dto.redirectUri);

    const debug = await this.metaGraph.debugToken(accessToken);
    const wabaId = this.resolveWabaId(debug, { ...options, expectedWabaId: options.expectedWabaId ?? dto.wabaId });

    const waba = await this.metaGraph.get<MetaGraphWaba>(accessToken, `/${wabaId}`, { fields: WABA_FIELDS });
    const metaBusinessId = this.resolveBusinessId(waba, dto.businessId);

    this.logger.log(`Resolved WABA ${waba.id} ("${waba.name}") owned by business ${metaBusinessId}`);
    return ResolvedWabaDto.from(waba, accessToken, metaBusinessId);
  }

  // Subscribes this app to the WABA's webhooks
  async subscribeWebhooks(accessToken: string, wabaId: string): Promise<boolean> {
    try {
      await this.metaGraph.post(accessToken, `/${wabaId}/subscribed_apps`, {});
      this.logger.log(`Subscribed to webhooks on WABA ${wabaId}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Webhook subscription failed for WABA ${wabaId}: ${message}`);
      return false;
    }
  }

  // The security gate on the whole flow, and now also its source of truth
  private resolveWabaId(debug: MetaGraphTokenDebug, options: ResolveWabaOptions): string {
    // No app-id comparison is needed: /debug_token is authenticated with this app's own app token,
    // so a token minted for a different app errors there rather than coming back inspectable
    if (!debug.is_valid) throw new BadRequestException(NOT_GRANTED);

    const granted = debug.granular_scopes?.find((entry) => entry.scope === REQUIRED_SCOPE);
    if (!granted) throw new BadRequestException(NOT_GRANTED);

    if (options.expectedWabaId) {
      // An absent target_ids means the scope is unrestricted rather than asset-scoped — a superset
      // of what is being asked for, so it passes
      if (granted.target_ids && !granted.target_ids.includes(options.expectedWabaId)) {
        this.logger.warn(`Token does not grant ${REQUIRED_SCOPE} on WABA ${options.expectedWabaId} — refusing connect`);
        throw new BadRequestException(NOT_GRANTED);
      }
      return options.expectedWabaId;
    }

    // Nothing named an account, so the grant has to identify one. An unrestricted scope (no
    // target_ids) cannot be narrowed here at all.
    const granted_ids = granted.target_ids ?? [];
    if (granted_ids.length === 0) {
      this.logger.warn(`Token grants ${REQUIRED_SCOPE} on no specific WABA — cannot derive the account`);
      throw new BadRequestException(NOT_GRANTED);
    }

    const connected = new Set(options.alreadyConnectedWabaIds ?? []);
    const fresh = granted_ids.filter((id) => !connected.has(id));

    if (fresh.length === 1) {
      this.logger.log(`Derived WABA ${fresh[0]} from the token's granular scopes`);
      return fresh[0];
    }

    // Every granted account is already stored, and there is only one — so this is the operator re-running the flow for the account they already hold
    if (fresh.length === 0 && granted_ids.length === 1) {
      this.logger.log(`WABA ${granted_ids[0]} is already connected — treating this as a credential refresh`);
      return granted_ids[0];
    }

    // Either several new accounts, or several already-connected ones and no way to tell which was
    // meant. Both are a genuine choice we cannot make on the operator's behalf.
    this.logger.warn(
      `Cannot single out a WABA — granted [${granted_ids.join(', ')}], of which [${fresh.join(', ')}] are unconnected`,
    );
    throw new BadRequestException(AMBIGUOUS_GRANT);
  }

  // The customer's Business Portfolio
  private resolveBusinessId(waba: MetaGraphWaba, reportedBusinessId?: string): string {
    const businessId = waba.owner_business_info?.id ?? waba.on_behalf_of_business_info?.id ?? reportedBusinessId;
    if (!businessId) {
      throw new BadRequestException({
        label: 'Business portfolio unavailable',
        detail:
          'Neither Meta nor the signup flow reported the business portfolio that owns this WhatsApp Business Account. The Vritti Meta app may need advanced access to business_management.',
      });
    }
    return businessId;
  }
}
