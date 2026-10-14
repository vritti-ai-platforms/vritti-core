import { PaymentEventsDomainModule } from '@domain/payment-events/payment-events.module';
import { Module } from '@nestjs/common';
import { PaymentEventsController } from './root/payment-events.controller';

@Module({
  imports: [PaymentEventsDomainModule],
  controllers: [PaymentEventsController],
})
export class OrgPaymentEventsModule {}
