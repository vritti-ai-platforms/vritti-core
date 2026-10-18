import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_WHATSAPP_OTPS } from '@vritti/communications-permissions/whatsapp-otps';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, OrgId } from '@/security/decorators';
import { SendWhatsappOtpInput, VerifyWhatsappOtpInput } from './graphql/whatsapp-otp.input';
import { SendWhatsappOtpResult, VerifyWhatsappOtpResult } from './graphql/whatsapp-otp.type';
import { WhatsappOtpsGatewayService } from './services/whatsapp-otps-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_WHATSAPP_OTPS.featureCode)
export class WhatsappOtpsAppResolver {
  private readonly logger = new Logger(WhatsappOtpsAppResolver.name);

  constructor(private readonly service: WhatsappOtpsGatewayService) {}

  // Sends a code over WhatsApp, replacing whatever code was live for the number
  @Mutation(() => SendWhatsappOtpResult, { name: 'sendWhatsappOtp' })
  @RequirePermission(ORG_WHATSAPP_OTPS.send)
  sendWhatsappOtp(
    @AppId() appId: string,
    @OrgId() organizationId: string,
    @Args('input') input: SendWhatsappOtpInput,
  ): Promise<SendWhatsappOtpResult> {
    this.logger.log('MUTATION sendWhatsappOtp');
    return this.service.send(appId, organizationId, input.recipient);
  }

  // Checks a code. Every failure mode returns `verified: false` — see the service
  @Mutation(() => VerifyWhatsappOtpResult, { name: 'verifyWhatsappOtp' })
  @RequirePermission(ORG_WHATSAPP_OTPS.verify)
  verifyWhatsappOtp(
    @AppId() appId: string,
    @Args('input') input: VerifyWhatsappOtpInput,
  ): Promise<VerifyWhatsappOtpResult> {
    this.logger.log('MUTATION verifyWhatsappOtp');
    return this.service.verify(appId, input.recipient, input.code);
  }
}
