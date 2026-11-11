import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { WebhookEventsDomainModule } from '@domain/webhook-events/webhook-events.module';
import { Module } from '@nestjs/common';
import { OrgPaymentIntentsModule } from '@/modules/organization/payment-intents/payment-intents.module';
import { WebhooksService } from './root/services/webhooks.service';
import { WebhooksController } from './root/webhooks.controller';

@Module({
  imports: [GatewaysDomainModule, WebhookEventsDomainModule, OrgPaymentIntentsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class InternalWebhooksModule {}
