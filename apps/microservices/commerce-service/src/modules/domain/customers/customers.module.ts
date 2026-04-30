import { Module } from '@nestjs/common';
import { CustomersRepository } from './repositories/customers.repository';
import { CustomersService } from './services/customers.service';

@Module({
  providers: [CustomersService, CustomersRepository],
  exports: [CustomersService, CustomersRepository],
})
export class CustomersDomainModule {}
