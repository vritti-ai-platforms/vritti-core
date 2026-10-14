import { Module } from '@nestjs/common';
import { WebhookEventsDomainRepository } from './repositories/webhook-events.repository';
import { WebhookEventsDomainService } from './services/webhook-events.service';

@Module({
  providers: [WebhookEventsDomainService, WebhookEventsDomainRepository],
  exports: [WebhookEventsDomainService, WebhookEventsDomainRepository],
})
export class WebhookEventsDomainModule {}
