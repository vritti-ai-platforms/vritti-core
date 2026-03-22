import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { CategoryDto } from '../dto/entity/category.dto';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';
import { CategoryService } from '../services/category.service';

@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Lists all active categories for an org+bu
  @MessagePattern('commerce.categories.findAll')
  findAll(@Payload() data: { organizationId: string; businessUnitId: string }): Promise<CategoryDto[]> {
    return this.categoryService.findAll(data.organizationId, data.businessUnitId);
  }

  // Returns a single category by ID
  @MessagePattern('commerce.categories.findById')
  findById(@Payload() data: { id: string }): Promise<CategoryDto> {
    return this.categoryService.findById(data.id);
  }

  // Creates a new category
  @MessagePattern('commerce.categories.create')
  create(@Payload() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.create(dto);
  }

  // Updates an existing category
  @MessagePattern('commerce.categories.update')
  update(@Payload() data: { id: string } & UpdateCategoryDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    return this.categoryService.update(id, dto);
  }

  // Deletes a category
  @MessagePattern('commerce.categories.delete')
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    return this.categoryService.delete(data.id);
  }
}
