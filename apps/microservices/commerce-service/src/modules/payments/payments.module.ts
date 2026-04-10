import { PaymentsDomainModule } from '@domain/payments/payments.module';
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PaymentsDomainModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
