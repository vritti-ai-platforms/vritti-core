import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException, SuccessResponseDto } from '@vritti/api-sdk';
import { ProductDto } from '../dto/entity/product.dto';
import type { CreateProductDto } from '../dto/request/create-product.dto';
import type { UpdateProductDto } from '../dto/request/update-product.dto';
import { ProductRepository } from '../repositories/product.repository';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly productRepository: ProductRepository) {}

  // Creates a new product
  async create(dto: CreateProductDto): Promise<ProductDto> {
    const product = await this.productRepository.create({
      organizationId: dto.organizationId,
      businessUnitId: dto.businessUnitId,
      categoryId: dto.categoryId ?? null,
      name: dto.name,
      description: dto.description ?? null,
      image: dto.image ?? null,
      price: String(dto.price),
      stationId: dto.stationId ?? null,
      sku: dto.sku ?? null,
      unit: dto.unit ?? null,
      isAvailable: dto.isAvailable ?? true,
    });

    this.logger.log(`Created product "${dto.name}" (${product.id})`);
    return ProductDto.from(product);
  }

  // Returns all active products for an org+bu
  async findAll(orgId: string, buId: string): Promise<ProductDto[]> {
    const products = await this.productRepository.findByOrgAndBu(orgId, buId);
    return products.map(ProductDto.from);
  }

  // Returns a single product by ID
  async findById(id: string): Promise<ProductDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found.');
    return ProductDto.from(product);
  }

  // Updates a product's fields
  async update(id: string, dto: UpdateProductDto): Promise<SuccessResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found.');

    await this.productRepository.update(id, {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.image !== undefined && { image: dto.image }),
      ...(dto.price !== undefined && { price: String(dto.price) }),
      ...(dto.stationId !== undefined && { stationId: dto.stationId }),
      ...(dto.sku !== undefined && { sku: dto.sku }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      updatedAt: new Date(),
    });

    this.logger.log(`Updated product ${id}`);
    return { success: true, message: 'Product updated successfully.' };
  }

  // Deletes a product
  async delete(id: string): Promise<SuccessResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found.');

    await this.productRepository.delete(id);

    this.logger.log(`Deleted product "${product.name}" (${id})`);
    return { success: true, message: 'Product deleted successfully.' };
  }
}
