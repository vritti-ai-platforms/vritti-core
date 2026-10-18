import { AppDomainModule } from '@domain/app/app.module';
import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { Module } from '@nestjs/common';
import { PaymentEventsModule } from './events/payment-events.module';
import { PaymentGatewaysGatewayService } from './gateways/services/payment-gateways-gateway.service';
import { PaymentIntentsGatewayService } from './intents/services/payment-intents-gateway.service';
import { PaymentLinkedAccountsGatewayService } from './linked-accounts/services/payment-linked-accounts-gateway.service';

const services = [PaymentGatewaysGatewayService, PaymentLinkedAccountsGatewayService, PaymentIntentsGatewayService];

// Payments gateway services, and nothing else — the same split as CommunicationsGatewayServicesModule.
@Module({
  imports: [PaymentGatewayConfigDomainModule, PaymentEventsModule, AppDomainModule],
  providers: services,
  exports: services,
})
export class PaymentsGatewayServicesModule {}
