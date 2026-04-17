import { Module } from '@nestjs/common';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SupplierContactsDomainModule } from '@domain/supplier-contacts/supplier-contacts.module';
import { SuppliersService } from './services/suppliers.service';

@Module({
  imports: [SupplierContactsDomainModule],
  providers: [SuppliersService, SuppliersRepository],
  exports: [SuppliersService, SuppliersRepository],
})
export class SuppliersDomainModule {}
