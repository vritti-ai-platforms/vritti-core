import { SupplierItemsRepository } from '@domain/supplier-items/repositories/supplier-items.repository';
import type { SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { SuppliersRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { SuppliersService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { type CreateResponseDto, PrimaryDatabaseService, type SuccessResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { ChangeSupplierCurrencyDto } from '../dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '../dto/request/create-supplier.dto';

@Injectable()
export class SuppliersRootService {
  private readonly logger = new Logger(SuppliersRootService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly suppliersService: SuppliersService,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly supplierItemsRepository: SupplierItemsRepository,
  ) {}

  // Creates a supplier referencing an existing party for its identity
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    const result = await this.suppliersService.create(data);
    this.logger.log(`Supplier "${result.data.partyName}" created`);
    return result;
  }

  // Changes supplier currency and reprices all supplier items atomically
  async changeCurrency(id: string, dto: Omit<ChangeSupplierCurrencyDto, 'id'>): Promise<SuccessResponseDto> {
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
