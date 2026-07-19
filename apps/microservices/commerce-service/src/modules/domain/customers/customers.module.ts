import { Module } from '@nestjs/common';
import { CustomersDomainRepository } from './repositories/customers.repository';
import { CustomersDomainService } from './services/customers.service';

@Module({
  providers: [CustomersDomainService, CustomersDomainRepository],
  exports: [CustomersDomainService, CustomersDomainRepository],
})
export class CustomersDomainModule {}
