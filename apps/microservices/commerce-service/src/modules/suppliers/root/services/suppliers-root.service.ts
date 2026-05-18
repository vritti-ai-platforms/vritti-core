import { SupplierContactsRepository } from '@domain/supplier-contacts/repositories/supplier-contacts.repository';
import type { SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, PrimaryDatabaseService } from '@vritti/api-sdk';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';

@Injectable()
export class SuppliersRootService {
  private readonly logger = new Logger(SuppliersRootService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly suppliersService: SuppliersService,
    private readonly supplierContactsRepository: SupplierContactsRepository,
  ) {}

  // Creates a supplier and its primary contact atomically in a transaction
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    return this.database.runInTransaction(async () => {
      const result = await this.suppliersService.create(data);

      await this.supplierContactsRepository.createContact({
        supplierId: result.data.id,
        name: data.primaryContact.name,
        phone: data.primaryContact.phone,
        alternatePhone: data.primaryContact.alternatePhone ?? null,
        email: data.primaryContact.email ?? null,
        alternateEmail: data.primaryContact.alternateEmail ?? null,
        designation: data.primaryContact.designation ?? null,
        isPrimary: true,
        isActive: true,
      });

      this.logger.log(`Supplier "${result.data.name}" created with primary contact`);
      return result;
    });
  }
}
