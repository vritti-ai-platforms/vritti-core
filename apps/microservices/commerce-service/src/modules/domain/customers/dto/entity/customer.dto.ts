import type { Customer } from '@/db/schema';

export class CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: Customer): CustomerDto {
    const dto = new CustomerDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.phone = entity.phone ?? null;
    dto.email = entity.email ?? null;
    dto.notes = entity.notes ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
