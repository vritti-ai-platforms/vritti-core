import type { PosTerminal } from '@/db/schema';

export class PosTerminalDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  code: string;
  locationId: string;
  locationName: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: PosTerminal & { locationName?: string | null }): PosTerminalDto {
    const dto = new PosTerminalDto();
    dto.id = entity.id;
    dto.organizationId = entity.organizationId;
    dto.businessUnitId = entity.businessUnitId;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.locationId = entity.locationId;
    dto.locationName = entity.locationName ?? null;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
