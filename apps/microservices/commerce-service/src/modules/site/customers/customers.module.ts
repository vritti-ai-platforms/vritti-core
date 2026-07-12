import { CustomersDomainModule } from '@domain/customers/customers.module';
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';

@Module({
  imports: [CustomersDomainModule],
  controllers: [CustomersController],
})
export class SiteCustomersModule {}
