import { GatewaysDomainModule } from '@domain/gateways/gateways.module';
import { PaymentAllocationsDomainModule } from '@domain/payment-allocations/payment-allocations.module';
import { PaymentEventsDomainModule } from '@domain/payment-events/payment-events.module';
import { PaymentIntentsDomainModule } from '@domain/payment-intents/payment-intents.module';
import { Module } from '@nestjs/common';
import { PaymentIntentsEventsController } from './events/payment-intents-events.controller';
import { PaymentIntentsEventsService } from './events/services/payment-intents-events.service';
import { PaymentIntentsRefundsController } from './refunds/payment-intents-refunds.controller';
import { PaymentIntentsRefundsService } from './refunds/services/payment-intents-refunds.service';
import { PaymentIntentsRootController } from './root/payment-intents-root.controller';
import { PaymentIntentsRootService } from './root/services/payment-intents-root.service';

// Payment intents and everything that happens to one: `root` opens, completes, cancels and expires it, `refunds`
// returns its money, `events` is the outbox core hears of each change through. The domain modules never import each
// other, so the sequences that span them live in these services. The root and refunds services are exported for the
// webhook ingest, which applies a gateway's payment and refund events through the same code as core's commands
@Module({
  imports: [
    GatewaysDomainModule,
    PaymentIntentsDomainModule,
    PaymentAllocationsDomainModule,
    PaymentEventsDomainModule,
  ],
  controllers: [PaymentIntentsRootController, PaymentIntentsRefundsController, PaymentIntentsEventsController],
  providers: [
    // Root
    PaymentIntentsRootService,
    // Refunds
    PaymentIntentsRefundsService,
    // Events
    PaymentIntentsEventsService,
  ],
  exports: [PaymentIntentsRootService, PaymentIntentsRefundsService],
})
export class OrgPaymentIntentsModule {}
