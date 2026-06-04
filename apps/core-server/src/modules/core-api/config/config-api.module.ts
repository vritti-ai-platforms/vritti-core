import { Module } from '@nestjs/common';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { ConfigWebhookController } from './controllers/config-webhook.controller';

@Module({
  controllers: [ConfigWebhookController],
  providers: [WebhookSecretGuard],
})
export class ConfigApiModule {}
