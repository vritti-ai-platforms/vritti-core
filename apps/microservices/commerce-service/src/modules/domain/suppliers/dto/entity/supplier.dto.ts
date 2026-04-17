import type { Supplier, SupplierItem } from '@/db/schema';

export class SupplierItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string | null;
  supplierCode: string | null;
  unitPrice: number | null;
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;

  static from(entity: SupplierItem, itemName?: string | null, uomSymbol?: string | null): SupplierItemDto {
    const dto = new SupplierItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? null;
    dto.supplierCode = entity.supplierCode ?? null;
    dto.unitPrice = entity.unitPrice ? Number(entity.unitPrice) : null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? '';
    dto.minOrderQuantity = entity.minOrderQuantity ? Number(entity.minOrderQuantity) : null;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.isPreferred = entity.isPreferred;
    dto.isActive = entity.isActive;
    return dto;
  }
}

export class SupplierDto {
  id: string;
  name: string;
  code: string;
  contactName: string | null;
  phone: string;
  email: string | null;
  website: string | null;
  address: string | null;
  gstin: string | null;
  paymentTerms: string | null;
  leadTimeDays: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: Supplier): SupplierDto {
    const dto = new SupplierDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.code = entity.code;
    dto.contactName = entity.contactName ?? null;
    dto.phone = entity.phone;
    dto.email = entity.email ?? null;
    dto.website = entity.website ?? null;
    dto.address = entity.address ?? null;
    dto.gstin = entity.gstin ?? null;
    dto.paymentTerms = entity.paymentTerms ?? null;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.notes = entity.notes ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class SupplierDetailDto extends SupplierDto {
  static fromDetail(entity: Supplier): SupplierDetailDto {
    const dto = new SupplierDetailDto();
    Object.assign(dto, SupplierDto.from(entity));
    return dto;
  }
}
