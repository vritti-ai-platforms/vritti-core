import type { SupplierContact } from '@/db/schema';

export class SupplierContactDto {
  id: string;
  supplierId: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  alternateEmail: string | null;
  designation: string | null;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: SupplierContact): SupplierContactDto {
    const dto = new SupplierContactDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.name = entity.name;
    dto.phone = entity.phone;
    dto.alternatePhone = entity.alternatePhone ?? null;
    dto.email = entity.email ?? null;
    dto.alternateEmail = entity.alternateEmail ?? null;
    dto.designation = entity.designation ?? null;
    dto.notes = entity.notes ?? null;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
