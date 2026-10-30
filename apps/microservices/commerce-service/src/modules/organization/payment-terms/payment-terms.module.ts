import { PaymentTermsDomainModule } from '@domain/payment-terms/payment-terms.module';
import { Module } from '@nestjs/common';
import { PaymentTermsController } from './payment-terms.controller';

@Module({
  imports: [PaymentTermsDomainModule],
  controllers: [PaymentTermsController],
})
export class OrgPaymentTermsModule {}
