import { Module } from '@nestjs/common';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SuppliersService } from './services/suppliers.service';

@Module({
  providers: [SuppliersService, SuppliersRepository],
  exports: [SuppliersService, SuppliersRepository],
})
export class SuppliersDomainModule {}
