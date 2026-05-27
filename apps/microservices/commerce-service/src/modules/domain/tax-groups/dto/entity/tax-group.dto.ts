import type { TaxGroup, TaxRate, TaxRateType } from '@/db/schema';

export class TaxRateDto {
  id: string;
  name: string;
  rate: number;
  type: TaxRateType;
  sortOrder: number;

  // Maps a TaxRate entity to a TaxRateDto
  static from(entity: TaxRate): TaxRateDto {
    const dto = new TaxRateDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.rate = entity.rate;
    dto.type = entity.type;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class TaxGroupDto {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  taxRates: TaxRateDto[];

  // Maps a TaxGroup entity with its tax rates to a TaxGroupDto
  static from(entity: TaxGroup, rates: TaxRate[] = []): TaxGroupDto {
    const dto = new TaxGroupDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.isDefault = entity.isDefault;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.taxRates = rates.map(TaxRateDto.from);
    return dto;
  }
}
