import { SuppliersDomainModule } from '@domain/suppliers/suppliers.module';
import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';

@Module({
  imports: [SuppliersDomainModule],
  controllers: [SuppliersController],
})
export class SuppliersModule {}
