import type { SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import type { ChangeSupplierCurrencyDto } from '@domain/suppliers/dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '@domain/suppliers/dto/request/create-supplier.dto';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConflictException } from '@vritti/api-sdk/exceptions';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    private readonly suppliersService: SuppliersDomainService,
    private readonly suppliersRepository: SuppliersDomainRepository,
  ) {}

  // Creates a supplier referencing an existing party for its identity
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    const result = await this.suppliersService.create(data);
    this.logger.log(`Supplier "${result.data.partyName}" created`);
    return result;
  }

  // Sets the currencies a supplier trades in and which one is its default; prices are never converted, so a
  // currency still used by the supplier's prices, quotations or open purchase orders cannot be dropped
  async changeCurrency(id: string, dto: Omit<ChangeSupplierCurrencyDto, 'id'>): Promise<SuccessResponseDto> {
    const supplier = await this.suppliersService.findById(id);
    const currencyCodes = [...new Set([dto.currencyCode, ...dto.currencyCodes])];
    const dropped = supplier.currencyCodes.filter((code) => !currencyCodes.includes(code));

    if (dropped.length > 0) {
      const usage = await this.suppliersRepository.countCurrencyUsage(id, dropped);
      const uses = (
        [
          ['price', usage.prices],
          ['quotation', usage.quotations],
          ['open purchase order', usage.purchaseOrders],
        ] as const
      )
        .filter(([, count]) => count > 0)
        .map(([noun, count]) => pluralize(noun, count, true));
      if (uses.length > 0) {
        throw new ConflictException({
          label: 'Currency In Use',
          detail: `${dropped.join(', ')} cannot be removed while ${uses.join(', ')} of this supplier use it.`,
          errors: [{ field: 'currencyCodes', message: `${dropped.join(', ')} is still in use` }],
        });
      }
    }

    await this.suppliersRepository.update(id, { currencyCode: dto.currencyCode, currencyCodes });
    this.logger.log(`Set supplier ${id} currencies to ${currencyCodes.join(', ')} (default ${dto.currencyCode})`);
    return { success: true, message: `Supplier currencies set to ${currencyCodes.join(', ')}.` };
  }
}
