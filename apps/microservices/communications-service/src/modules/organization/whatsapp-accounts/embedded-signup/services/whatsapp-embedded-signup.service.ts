import type { WhatsappAccountDto } from '@domain/whatsapp-accounts/dto/entity/whatsapp-account.dto';
import { WhatsappAccountsDomainService } from '@domain/whatsapp-accounts/services/whatsapp-accounts.service';
import type { ResolvedWabaDto } from '@domain/whatsapp-embedded-signup/dto/entity/resolved-waba.dto';
import type { ConnectEmbeddedSignupDto } from '@domain/whatsapp-embedded-signup/dto/request/connect-embedded-signup.dto';
import { WhatsappEmbeddedSignupDomainService } from '@domain/whatsapp-embedded-signup/services/whatsapp-embedded-signup.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';

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
    const existing = await this.accountsService.findByWabaId(dto.wabaId);
    const resolved = await this.resolveAndSubscribe(dto);

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
    // Checked before the exchange: the authorization code is single-use, so spending it on a request
    // that cannot succeed would force the operator through the popup twice
    const existing = await this.accountsService.findById(id);
    if (existing.wabaId !== dto.wabaId) {
      throw new BadRequestException({
        label: 'Wrong account selected',
        detail: `This connection is for WhatsApp Business Account ${existing.wabaId}, but ${dto.wabaId} was selected. Run the flow again and pick the same account.`,
      });
    }

    const resolved = await this.resolveAndSubscribe(dto);
    const data = await this.applyCredentials(id, resolved);
    return { success: true, message: `WhatsApp account "${data.name}" reconnected successfully.` };
  }

  // Resolve then subscribe, in that order — the subscription needs the token the resolve mints
  private async resolveAndSubscribe(
    dto: ConnectEmbeddedSignupDto,
  ): Promise<{ waba: ResolvedWabaDto; webhooksSubscribed: boolean }> {
    const waba = await this.embeddedSignupService.resolve(dto);
    const webhooksSubscribed = await this.embeddedSignupService.subscribeWebhooks(waba.accessToken, waba.wabaId);

    if (dto.event === 'FINISH_ONLY_WABA') {
      this.logger.log(`WABA ${waba.wabaId} has no phone number yet — it cannot send until one is added`);
    }

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
