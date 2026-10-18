import { AppWebhookDomainModule } from '@domain/app-webhook/app-webhook.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { Module } from '@nestjs/common';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import { CommerceOrderPaymentHandlerService } from './services/commerce-order-payment-handler.service';
import { PaymentEventDispatcherService } from './services/payment-event-dispatcher.service';
import { PaymentJobsService } from './services/payment-jobs.service';

// Payment event fan-out and the background jobs that feed it.
@Module({
  imports: [PaymentGatewayConfigDomainModule, AppWebhookDomainModule, OrganizationDomainModule],
  providers: [
    ScopedNatsClientService,
    CommerceOrderPaymentHandlerService,
    PaymentEventDispatcherService,
    PaymentJobsService,
  ],
  exports: [PaymentEventDispatcherService],
})
export class PaymentEventsModule {}
