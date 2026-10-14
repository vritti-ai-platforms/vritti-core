import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { PaymentAttemptsDomainModule } from '@domain/payment-attempts/payment-attempts.module';
import { PaymentEventsDomainModule } from '@domain/payment-events/payment-events.module';
import { PaymentIntentsDomainModule } from '@domain/payment-intents/payment-intents.module';
import { PaymentTransfersDomainModule } from '@domain/payment-transfers/payment-transfers.module';
import { Module } from '@nestjs/common';
import { PaymentLifecycleService } from './services/payment-lifecycle.service';

// The application layer over the payment domains: domain modules never import each other, so the sequence that
// spans them — open an intent, apply a payment, record its event — lives here and is shared by the NATS commands
// and the webhook ingest alike
@Module({
  imports: [
    GatewaysDomainModule,
    PaymentIntentsDomainModule,
    PaymentAttemptsDomainModule,
    PaymentEventsDomainModule,
    PaymentTransfersDomainModule,
  ],
  providers: [PaymentLifecycleService],
  exports: [PaymentLifecycleService],
})
export class PaymentLifecycleModule {}
