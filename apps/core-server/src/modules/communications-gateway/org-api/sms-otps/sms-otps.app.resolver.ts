import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { ORG_SMS_OTPS } from '@vritti/communications-permissions/sms-otps';
import { AppTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AppId, OrgId } from '@/security/decorators';
import { SendSmsOtpInput, VerifySmsOtpInput } from './graphql/sms-otp.input';
import { SendSmsOtpResult, VerifySmsOtpResult } from './graphql/sms-otp.type';
import { SmsOtpsGatewayService } from './services/sms-otps-gateway.service';

@Resolver()
@Require(AuthType.App, AppTypeValues.GRAPHQL)
@RequireFeature(ORG_SMS_OTPS.featureCode)
export class SmsOtpsAppResolver {
  private readonly logger = new Logger(SmsOtpsAppResolver.name);

  constructor(private readonly service: SmsOtpsGatewayService) {}

  // Sends a code over SMS, replacing whatever code was live for the number
  @Mutation(() => SendSmsOtpResult, { name: 'sendSmsOtp' })
  @RequirePermission(ORG_SMS_OTPS.send)
  sendSmsOtp(
    @AppId() appId: string,
    @OrgId() organizationId: string,
    @Args('input') input: SendSmsOtpInput,
  ): Promise<SendSmsOtpResult> {
    this.logger.log('MUTATION sendSmsOtp');
    return this.service.send(appId, organizationId, input.recipient);
  }

  // Checks a code. Every failure mode returns `verified: false` — see the service
  @Mutation(() => VerifySmsOtpResult, { name: 'verifySmsOtp' })
  @RequirePermission(ORG_SMS_OTPS.verify)
  verifySmsOtp(@AppId() appId: string, @Args('input') input: VerifySmsOtpInput): Promise<VerifySmsOtpResult> {
    this.logger.log('MUTATION verifySmsOtp');
    return this.service.verify(appId, input.recipient, input.code);
  }
}
