import { SupplierContactsDomainModule } from '@domain/supplier-contacts/supplier-contacts.module';
import { Module } from '@nestjs/common';
import { SupplierContactsController } from './supplier-contacts.controller';

@Module({
  imports: [SupplierContactsDomainModule],
  controllers: [SupplierContactsController],
})
export class SupplierContactsModule {}
