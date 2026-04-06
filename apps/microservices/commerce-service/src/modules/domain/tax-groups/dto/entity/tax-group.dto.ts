import type { TaxGroup } from '@/db/schema';

export class TaxGroupDto {
  id: string;
  name: string;
  rate: number;
  hsnSacCode: string | null;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;

  // Maps a TaxGroup entity to a TaxGroupDto
  static from(entity: TaxGroup): TaxGroupDto {
    const dto = new TaxGroupDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.rate = Number(entity.rate);
    dto.hsnSacCode = entity.hsnSacCode ?? null;
    dto.cgstRate = Number(entity.cgstRate);
    dto.sgstRate = Number(entity.sgstRate);
    dto.igstRate = Number(entity.igstRate);
    dto.cessRate = Number(entity.cessRate);
    dto.isDefault = entity.isDefault;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}
