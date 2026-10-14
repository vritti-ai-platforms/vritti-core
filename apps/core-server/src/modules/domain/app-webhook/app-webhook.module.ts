import { Module } from '@nestjs/common';
import { AppWebhookEndpointDomainRepository } from './repositories/app-webhook-endpoint.repository';
import { WebhookDeliveryDomainRepository } from './repositories/webhook-delivery.repository';
import { AppWebhookEndpointDomainService } from './services/app-webhook-endpoint.service';
import { WebhookDeliveryDomainService } from './services/webhook-delivery.service';

// Owns an app's outbound webhook endpoint and the deliveries queued to it
@Module({
  providers: [
    AppWebhookEndpointDomainService,
    AppWebhookEndpointDomainRepository,
    WebhookDeliveryDomainService,
    WebhookDeliveryDomainRepository,
  ],
  exports: [AppWebhookEndpointDomainService, WebhookDeliveryDomainService],
})
export class AppWebhookDomainModule {}
