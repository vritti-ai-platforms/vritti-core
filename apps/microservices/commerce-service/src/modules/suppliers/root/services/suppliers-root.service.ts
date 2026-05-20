import { SupplierContactsRepository } from '@domain/supplier-contacts/repositories/supplier-contacts.repository';
import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import type { SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException, type CreateResponseDto, PrimaryDatabaseService, type SuccessResponseDto } from '@vritti/api-sdk';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';
import type { ChangeSupplierCurrencyDto } from '../dto/request/change-supplier-currency.dto';

@Injectable()
export class SuppliersRootService {
  private readonly logger = new Logger(SuppliersRootService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly suppliersService: SuppliersService,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly supplierContactsRepository: SupplierContactsRepository,
    private readonly supplierItemsRepository: SupplierItemsRepository,
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

  // Changes supplier currency and reprices all supplier items atomically
  async changeCurrency(id: string, dto: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersService.findById(id);

    if (supplier.currencyCode === dto.currencyCode) {
      return { success: true, message: 'Currency unchanged.' };
    }

    if (dto.conversionRate == null || dto.conversionRate <= 0) {
      throw new BadRequestException({
        label: 'Conversion Rate Required',
        detail: `A conversion rate is required when changing supplier currency from ${supplier.currencyCode} to ${dto.currencyCode}.`,
        errors: [{ field: 'conversionRate', message: 'Conversion rate must be greater than 0.' }],
      });
    }

    return this.database.runInTransaction(async () => {
      await this.suppliersRepository.update(id, { currencyCode: dto.currencyCode });
      await this.supplierItemsRepository.recalculateAllForSupplier(id, dto.currencyCode, dto.conversionRate as number);
      this.logger.log(`Changed supplier ${id} currency from ${supplier.currencyCode} to ${dto.currencyCode}`);
      return { success: true, message: `Supplier currency changed to ${dto.currencyCode}.` };
    });
  }
}
