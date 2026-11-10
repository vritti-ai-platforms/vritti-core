import type { TaxGroup, TaxTreatment } from '@/db/schema';

export class TaxGroupDto {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  treatment: TaxTreatment;
  legalText: string | null;
  isActive: boolean;
  rateCount: number;
  classCount: number;
  canDelete: boolean;
  canDeactivate: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a tax group with its rate and class-mapping counts; a group with mapped classes cannot be deleted, and one that
  // a mapping in force or still to come names cannot be deactivated
  static from(entity: TaxGroup & { rateCount: number; classCount: number; openClassCount: number }): TaxGroupDto {
    const dto = new TaxGroupDto();
    dto.id = entity.id;
    dto.countryCode = entity.countryCode;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.treatment = entity.treatment;
    dto.legalText = entity.legalText ?? null;
    dto.isActive = entity.isActive;
    dto.rateCount = entity.rateCount;
    dto.classCount = entity.classCount;
    dto.canDelete = entity.classCount === 0;
    dto.canDeactivate = entity.openClassCount === 0;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
