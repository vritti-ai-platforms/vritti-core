import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { PaymentTransfersDomainModule } from '@domain/payment-transfers/payment-transfers.module';
import { WebhookEventsDomainModule } from '@domain/webhook-events/webhook-events.module';
import { Module } from '@nestjs/common';
import { PaymentLifecycleModule } from '@/modules/payment-lifecycle/payment-lifecycle.module';
import { WebhooksService } from './root/services/webhooks.service';
import { WebhooksController } from './root/webhooks.controller';

@Module({
  imports: [GatewaysDomainModule, WebhookEventsDomainModule, PaymentTransfersDomainModule, PaymentLifecycleModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class InternalWebhooksModule {}
