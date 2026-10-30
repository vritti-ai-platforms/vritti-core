import { AppWebhookDomainModule } from '@domain/app-webhook/app-webhook.module';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { Module } from '@nestjs/common';
import { ScopedNatsClientService } from '@/services/scoped-nats-client.service';
import { CheckoutPaymentHandlerService } from './services/checkout-payment-handler.service';
import { PaymentEventDispatcherService } from './services/payment-event-dispatcher.service';
import { PaymentJobsService } from './services/payment-jobs.service';
import { WebhookCheckPaymentHandlerService } from './services/webhook-check-payment-handler.service';

// Payment event fan-out and the background jobs that feed it.
@Module({
  imports: [PaymentGatewayConfigDomainModule, AppWebhookDomainModule, OrganizationDomainModule],
  providers: [
    ScopedNatsClientService,
    CheckoutPaymentHandlerService,
    WebhookCheckPaymentHandlerService,
    PaymentEventDispatcherService,
    PaymentJobsService,
  ],
  exports: [PaymentEventDispatcherService],
})
export class PaymentEventsModule {}
