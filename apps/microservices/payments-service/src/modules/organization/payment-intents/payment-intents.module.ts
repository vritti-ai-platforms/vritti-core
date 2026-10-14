import { Module } from '@nestjs/common';
import { PaymentLifecycleModule } from '@/modules/payment-lifecycle/payment-lifecycle.module';
import { PaymentIntentsController } from './root/payment-intents.controller';

@Module({
  imports: [PaymentLifecycleModule],
  controllers: [PaymentIntentsController],
})
export class OrgPaymentIntentsModule {}
