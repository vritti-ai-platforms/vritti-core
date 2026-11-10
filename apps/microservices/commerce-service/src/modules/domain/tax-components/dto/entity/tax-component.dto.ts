import type { TaxAuthorityLevel, TaxComponent } from '@/db/schema';

export class TaxComponentDto {
  id: string;
  countryCode: string;
  code: string;
  name: string;
  authorityLevel: TaxAuthorityLevel;
  standsInForId: string | null;
  standsInForName: string | null;
  isRecoverable: boolean;
  isWithholding: boolean;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a tax component with its rate and stand-in counts and the name of the component it stands in for; system
  // components, and those tax-group rates use or other components stand in for, cannot be deleted, and one that a rate
  // in force or still to come uses cannot be deactivated
  static from(
    entity: TaxComponent & {
      rateCount: number;
      openRateCount: number;
      standInCount: number;
      standsInForName: string | null;
    },
  ): TaxComponentDto {
    const dto = new TaxComponentDto();
    dto.id = entity.id;
    dto.countryCode = entity.countryCode;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.authorityLevel = entity.authorityLevel;
    dto.standsInForId = entity.standsInForId;
    dto.standsInForName = entity.standsInForName;
    dto.isRecoverable = entity.isRecoverable;
    dto.isWithholding = entity.isWithholding;
    dto.isActive = entity.isActive;
    dto.isSystem = entity.isSystem;
    dto.canDelete = !entity.isSystem && entity.rateCount === 0 && entity.standInCount === 0;
    dto.canDeactivate = entity.openRateCount === 0;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
