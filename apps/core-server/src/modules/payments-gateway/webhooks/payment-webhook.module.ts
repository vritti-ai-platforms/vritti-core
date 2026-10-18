import { PaymentGatewayConfigDomainModule } from '@domain/payment-gateway-config/payment-gateway-config.module';
import { Module } from '@nestjs/common';
import { PaymentEventsModule } from '../events/payment-events.module';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentWebhookService } from './services/payment-webhook.service';

// Unprefixed, mirroring WhatsappWebhookModule: a provider calls the literal URL registered in its dashboard, so this
// must not sit behind a RouterModule prefix.
@Module({
  imports: [PaymentGatewayConfigDomainModule, PaymentEventsModule],
  controllers: [PaymentWebhookController],
  providers: [PaymentWebhookService],
})
export class PaymentWebhookModule {}
