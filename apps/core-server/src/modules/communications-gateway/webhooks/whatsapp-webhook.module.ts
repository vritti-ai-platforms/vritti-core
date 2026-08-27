import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { WhatsappWebhookService } from './services/whatsapp-webhook.service';
import { WhatsappWebhookController } from './whatsapp-webhook.controller';

// Unprefixed, mirroring GiteaInternalModule: Meta calls a literal path registered in its dashboard, so
// this must not sit behind the `communications-api` RouterModule prefix.
@Module({
  imports: [AppDomainModule],
  controllers: [WhatsappWebhookController],
  providers: [WhatsappWebhookService],
})
export class WhatsappWebhookModule {}
