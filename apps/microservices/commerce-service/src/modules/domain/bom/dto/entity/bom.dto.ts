import type { Bom, BomLine } from '@/db/schema';

export class BomLineDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  requiredQuantity: number;

  static from(entity: BomLine, itemName?: string | null): BomLineDto {
    const dto = new BomLineDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.requiredQuantity = Number(entity.requiredQuantity);
    return dto;
  }
}

export class BomDto {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: Bom): BomDto {
    const dto = new BomDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class BomDetailDto extends BomDto {
  lines: BomLineDto[];

  static fromDetail(entity: Bom, lines: BomLineDto[]): BomDetailDto {
    const dto = new BomDetailDto();
    Object.assign(dto, BomDto.from(entity));
    dto.lines = lines;
    return dto;
  }
}
