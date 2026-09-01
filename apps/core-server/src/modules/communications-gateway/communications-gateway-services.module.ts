import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { CommunicationsInternalService } from './internal/services/communications-internal.service';
import { SmsOtpsGatewayService } from './org-api/sms-otps/services/sms-otps-gateway.service';
import { SmsProvidersGatewayService } from './org-api/sms-providers/services/sms-providers-gateway.service';
import { WhatsappAccountsGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-gateway.service';
import { WhatsappAccountsPhoneNumbersGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-phone-numbers-gateway.service';
import { WhatsappAccountsTemplatesGatewayService } from './org-api/whatsapp-accounts/services/whatsapp-accounts-templates-gateway.service';
import { WhatsappOtpsGatewayService } from './org-api/whatsapp-otps/services/whatsapp-otps-gateway.service';

const services = [
  SmsOtpsGatewayService,
  SmsProvidersGatewayService,
  WhatsappAccountsGatewayService,
  WhatsappAccountsPhoneNumbersGatewayService,
  WhatsappAccountsTemplatesGatewayService,
  WhatsappOtpsGatewayService,
  CommunicationsInternalService,
];

/**
 * Communications gateway services, and nothing else.
 *
 * Same reason as `CommerceGatewayServicesModule`: both the internal surface
 * (`CommunicationsGatewayModule`, which owns the controllers) and the external-app surface
 * (`CommunicationsAppGatewayModule`) need `WhatsappOtpsGatewayService`, and neither may import the
 * other without dragging its resolvers into the other's schema.
 */
@Module({
  imports: [AppDomainModule],
  providers: services,
  exports: services,
})
export class CommunicationsGatewayServicesModule {}
