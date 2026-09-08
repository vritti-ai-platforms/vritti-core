import type { WhatsappAccountDto } from '@domain/whatsapp-accounts/dto/entity/whatsapp-account.dto';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import type { ResolvedWabaDto } from '@domain/whatsapp-embedded-signup/dto/entity/resolved-waba.dto';
import type { ConnectEmbeddedSignupDto } from '@domain/whatsapp-embedded-signup/dto/request/connect-embedded-signup.dto';
import {
  type ResolveWabaOptions,
  WhatsappEmbeddedSignupDomainService,
} from '@domain/whatsapp-embedded-signup/services/whatsapp-embedded-signup.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';

// Coordinates the two domains a connect touches — the Graph resolve and the account row. Domain
// modules never import each other, so the sequencing lives here, mirroring WhatsappPhoneNumbersService.
@Injectable()
export class WhatsappEmbeddedSignupService {
  private readonly logger = new Logger(WhatsappEmbeddedSignupService.name);

  constructor(
    private readonly accountsService: WhatsappAccountsDomainService,
    private readonly embeddedSignupService: WhatsappEmbeddedSignupDomainService,
  ) {}

  /**
   * Connects the WABA the operator granted in Meta's popup. Everything the old manual form asked for
   * — name, business portfolio, token — is resolved from Meta instead of typed.
   *
   * Re-running the popup for an account this organization already holds is treated as a reconnect
   * rather than a conflict: it is the natural repair gesture once a token has been revoked, and with
   * the manual form gone it is the only way to supply a fresh credential.
   */
  async connect(dto: ConnectEmbeddedSignupDto): Promise<CreateResponseDto<WhatsappAccountDto>> {
    /**
     * The org's existing accounts are read BEFORE the exchange, because they are what makes the
     * derivation unambiguous: Meta's grant accumulates across every account the operator has ever
     * authorised, so excluding the ones already stored is what identifies the new one.
     */
    const alreadyConnectedWabaIds = await this.accountsService.listConnectedWabaIds();
    const resolved = await this.resolveAndSubscribe(dto, { alreadyConnectedWabaIds });
    const existing = await this.accountsService.findByWabaId(resolved.waba.wabaId);

    if (existing) {
      this.logger.log(`WABA ${resolved.waba.wabaId} already connected (${existing.id}) — replacing its credential`);
      const data = await this.applyCredentials(existing.id, resolved);
      return { success: true, message: `WhatsApp account "${data.name}" reconnected successfully.`, data };
    }

    return this.accountsService.create({
      metaBusinessId: resolved.waba.metaBusinessId,
      wabaId: resolved.waba.wabaId,
      name: resolved.waba.name,
      accessToken: resolved.waba.accessToken,
      webhooksSubscribed: resolved.webhooksSubscribed,
    });
  }

  // Repairs one account's credential in place. The row keeps its id, so anything pointing at it —
  // an app's OTP configuration, a cached detail query — keeps working.
  async reconnect(id: string, dto: ConnectEmbeddedSignupDto): Promise<SuccessResponseDto> {
    const existing = await this.accountsService.findById(id);

    /**
     * The account is named up front rather than compared afterwards.
     *
     * A reconnect already knows which WABA it is for, so the id is handed to the resolve as the
     * expected one and verified against the token's grant — if the new credential does not cover
     * this account, that check refuses it. The previous version compared `existing.wabaId` against a
     * value the popup used to report, which the redirect flow does not send at all, so it rejected
     * every reconnect as "wrong account selected".
     */
    const resolved = await this.resolveAndSubscribe(dto, { expectedWabaId: existing.wabaId });
    const data = await this.applyCredentials(id, resolved);
    return { success: true, message: `WhatsApp account "${data.name}" reconnected successfully.` };
  }

  // Resolve then subscribe, in that order — the subscription needs the token the resolve mints
  private async resolveAndSubscribe(
    dto: ConnectEmbeddedSignupDto,
    options: ResolveWabaOptions,
  ): Promise<{ waba: ResolvedWabaDto; webhooksSubscribed: boolean }> {
    const waba = await this.embeddedSignupService.resolve(dto, options);
    const webhooksSubscribed = await this.embeddedSignupService.subscribeWebhooks(waba.accessToken, waba.wabaId);

    // A WABA with no phone number yet is a legitimate half-done state and used to be reported by the
    // popup's terminal event. The redirect flow reports no event, and the empty phone-numbers list
    // says the same thing — so nothing is inferred here.
    return { waba, webhooksSubscribed };
  }

  private applyCredentials(
    id: string,
    resolved: { waba: ResolvedWabaDto; webhooksSubscribed: boolean },
  ): Promise<WhatsappAccountDto> {
    return this.accountsService.replaceCredentials(id, {
      accessToken: resolved.waba.accessToken,
      name: resolved.waba.name,
      metaBusinessId: resolved.waba.metaBusinessId,
      webhooksSubscribed: resolved.webhooksSubscribed,
    });
  }
}
