import { AppDomainModule } from '@domain/app/app.module';
import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { PayoutChannelDomainModule } from '@domain/payout-channel/payout-channel.module';
import { SiteDomainModule } from '@domain/site/site.module';
import { Module } from '@nestjs/common';
import { PaymentEventsModule } from './events/payment-events.module';
import { PaymentGatewaysGatewayService } from './gateways/services/payment-gateways-gateway.service';
import { PaymentIntentsGatewayService } from './intents/services/payment-intents-gateway.service';

const services = [PaymentGatewaysGatewayService, PaymentIntentsGatewayService];

// Payments gateway services, and nothing else — the same split as CommunicationsGatewayServicesModule.
@Module({
  imports: [
    PaymentGatewayConfigDomainModule,
    PayoutChannelDomainModule,
    PaymentEventsModule,
    AppDomainModule,
    SiteDomainModule,
  ],
  providers: services,
  exports: services,
})
export class PaymentsGatewayServicesModule {}
