import { Module } from '@nestjs/common';
import { SupplierContactsRepository } from './repositories/supplier-contacts.repository';
import { SupplierContactsService } from './services/supplier-contacts.service';

@Module({
  providers: [SupplierContactsService, SupplierContactsRepository],
  exports: [SupplierContactsService, SupplierContactsRepository],
})
export class SupplierContactsDomainModule {}
