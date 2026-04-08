import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService, type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';
import type { CategoryResponseDto } from '../dto/response/category-response.dto';

@Injectable()
export class CategoriesGatewayService {
  private readonly logger = new Logger(CategoriesGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated category options for the select component
  async select(query: SelectOptionsQueryDto & { buId: string }): Promise<SelectQueryResult> {
    this.logger.log('categories.select');
    return this.nats.send('commerce', 'categories.select', query);
  }

  // Returns all categories for the given BU
  async list(): Promise<CategoryResponseDto[]> {
    this.logger.log('categories.list');
    return this.nats.send('commerce', 'categories.list');
  }

  // Creates a new category
  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    this.logger.log(`categories.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'categories.create', dto);
  }

  // Finds a category by ID
  async findById(id: string): Promise<CategoryResponseDto> {
    this.logger.log(`categories.findById — id: ${id}`);
    return this.nats.send('commerce', 'categories.findById', { id });
  }

  // Updates a category by ID
  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    this.logger.log(`categories.update — id: ${id}`);
    return this.nats.send('commerce', 'categories.update', { id, ...dto });
  }

  // Deletes a category by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`categories.delete — id: ${id}`);
    return this.nats.send('commerce', 'categories.delete', { id });
  }
}
