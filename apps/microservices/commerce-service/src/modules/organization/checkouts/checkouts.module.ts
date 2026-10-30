import { CheckoutsDomainModule } from '@domain/checkouts/checkouts.module';
import { Module } from '@nestjs/common';
import { CheckoutsController } from './checkouts.controller';

@Module({
  imports: [CheckoutsDomainModule],
  controllers: [CheckoutsController],
})
export class OrgCheckoutsModule {}
