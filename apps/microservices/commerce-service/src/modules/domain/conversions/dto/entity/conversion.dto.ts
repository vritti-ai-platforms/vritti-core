import type { Conversion, ConversionInput, ConversionOutput } from '@/db/schema';

export class ConversionInputDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
  wastageQuantity: number;

  static from(entity: ConversionInput, itemName?: string | null): ConversionInputDto {
    const dto = new ConversionInputDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.quantity = Number(entity.quantity);
    dto.wastageQuantity = Number(entity.wastageQuantity);
    return dto;
  }
}

export class ConversionOutputDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
  wastageQuantity: number;

  static from(entity: ConversionOutput, itemName?: string | null): ConversionOutputDto {
    const dto = new ConversionOutputDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.quantity = Number(entity.quantity);
    dto.wastageQuantity = Number(entity.wastageQuantity);
    return dto;
  }
}

export class ConversionDto {
  id: string;
  bomId: string | null;
  status: string;
  producedBy: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: Conversion): ConversionDto {
    const dto = new ConversionDto();
    dto.id = entity.id;
    dto.bomId = entity.bomId ?? null;
    dto.status = entity.status;
    dto.producedBy = entity.producedBy ?? null;
    dto.startedAt = entity.startedAt?.toISOString() ?? null;
    dto.completedAt = entity.completedAt?.toISOString() ?? null;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class ConversionDetailDto extends ConversionDto {
  inputs: ConversionInputDto[];
  outputs: ConversionOutputDto[];

  static fromDetail(
    entity: Conversion,
    inputs: ConversionInputDto[],
    outputs: ConversionOutputDto[],
  ): ConversionDetailDto {
    const dto = new ConversionDetailDto();
    Object.assign(dto, ConversionDto.from(entity));
    dto.inputs = inputs;
    dto.outputs = outputs;
    return dto;
  }
}
