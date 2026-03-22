import type { Product } from '@/db/schema';

export class ProductDto {
  id: string;
  organizationId: string;
  businessUnitId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  price: string;
  stationId: string | null;
  sku: string | null;
  unit: string | null;
  isAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  // Creates a DTO from a Product entity
  static from(product: Product): ProductDto {
    const dto = new ProductDto();
    dto.id = product.id;
    dto.organizationId = product.organizationId;
    dto.businessUnitId = product.businessUnitId;
    dto.categoryId = product.categoryId ?? null;
    dto.name = product.name;
    dto.description = product.description ?? null;
    dto.image = product.image ?? null;
    dto.price = product.price;
    dto.stationId = product.stationId ?? null;
    dto.sku = product.sku ?? null;
    dto.unit = product.unit ?? null;
    dto.isAvailable = product.isAvailable;
    dto.isActive = product.isActive;
    dto.sortOrder = product.sortOrder;
    dto.createdAt = product.createdAt.toISOString();
    dto.updatedAt = product.updatedAt.toISOString();
    return dto;
  }
}
