import type { Station } from '@/db/schema';

export class StationDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  // Creates a DTO from a Station entity
  static from(station: Station): StationDto {
    const dto = new StationDto();
    dto.id = station.id;
    dto.organizationId = station.organizationId;
    dto.businessUnitId = station.businessUnitId;
    dto.name = station.name;
    dto.isActive = station.isActive;
    dto.sortOrder = station.sortOrder;
    dto.createdAt = station.createdAt.toISOString();
    dto.updatedAt = station.updatedAt.toISOString();
    return dto;
  }
}
