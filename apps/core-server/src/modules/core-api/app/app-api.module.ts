import { AppWebhookDomainModule } from '@domain/app-webhook/app-webhook.module';
import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { AppController } from './controllers/app.controller';
import { AppWebhookController } from './controllers/app-webhook.controller';
import { AppWebhookService } from './services/app-webhook.service';

@Module({
  imports: [AppDomainModule, AppWebhookDomainModule],
  controllers: [AppController, AppWebhookController],
  providers: [AppWebhookService],
})
export class AppApiModule {}
