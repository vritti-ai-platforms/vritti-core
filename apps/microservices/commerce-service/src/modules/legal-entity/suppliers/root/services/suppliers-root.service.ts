import type { ChangeSupplierCurrencyDto } from '@domain/suppliers/dto/request/change-supplier-currency.dto';
import type { CreateSupplierDto } from '@domain/suppliers/dto/request/create-supplier.dto';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly suppliersService: SuppliersDomainService) {}

  // Creates a supplier referencing an existing party for its identity
  async create(data: CreateSupplierDto): Promise<CreateResponseDto<{ id: string; code: string }>> {
    const result = await this.suppliersService.create(data);
    this.logger.log(`Supplier "${result.data.code}" created`);
    return result;
  }

  // Sets the currencies a supplier trades in and which one is its default
  changeCurrency(id: string, dto: Omit<ChangeSupplierCurrencyDto, 'id'>): Promise<SuccessResponseDto> {
    return this.suppliersService.changeCurrency(id, dto);
  }
}
