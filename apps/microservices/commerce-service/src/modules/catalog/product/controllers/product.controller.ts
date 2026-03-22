import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { ProductDto } from '../dto/entity/product.dto';
import type { CreateProductDto } from '../dto/request/create-product.dto';
import type { UpdateProductDto } from '../dto/request/update-product.dto';
import { ProductService } from '../services/product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Lists all active products for an org+bu
  @MessagePattern('commerce.products.findAll')
  findAll(@Payload() data: { organizationId: string; businessUnitId: string }): Promise<ProductDto[]> {
    return this.productService.findAll(data.organizationId, data.businessUnitId);
  }

  // Returns a single product by ID
  @MessagePattern('commerce.products.findById')
  findById(@Payload() data: { id: string }): Promise<ProductDto> {
    return this.productService.findById(data.id);
  }

  // Creates a new product
  @MessagePattern('commerce.products.create')
  create(@Payload() dto: CreateProductDto): Promise<ProductDto> {
    return this.productService.create(dto);
  }

  // Updates an existing product
  @MessagePattern('commerce.products.update')
  update(@Payload() data: { id: string } & UpdateProductDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    return this.productService.update(id, dto);
  }

  // Deletes a product
  @MessagePattern('commerce.products.delete')
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    return this.productService.delete(data.id);
  }
}
