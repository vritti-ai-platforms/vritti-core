import type { TaxGroup, TaxRate } from '@/db/schema';

export class TaxRateDto {
  id: string;
  name: string;
  rate: number;
  sortOrder: number;

  // Maps a TaxRate entity to a TaxRateDto
  static from(entity: TaxRate): TaxRateDto {
    const dto = new TaxRateDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.rate = entity.rate;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class TaxGroupDto {
  id: string;
  name: string;
  isActive: boolean;
  canDelete: boolean;
  taxRates: TaxRateDto[];

  // Maps a TaxGroup entity with its tax rates to a TaxGroupDto
  static from(entity: TaxGroup, rates: TaxRate[] = [], canDelete = true): TaxGroupDto {
    const dto = new TaxGroupDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.isActive = entity.isActive;
    dto.canDelete = canDelete;
    dto.taxRates = rates.map(TaxRateDto.from);
    return dto;
  }
}
