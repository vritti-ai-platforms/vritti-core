import { CostCategoryDto } from '@domain/cost-categories/dto/entity/cost-category.dto';
import { CreateCostCategoryDto } from '@domain/cost-categories/dto/request/create-cost-category.dto';
import { UpdateCostCategoryDto } from '@domain/cost-categories/dto/request/update-cost-category.dto';
import { CostCategoriesDomainService } from '@domain/cost-categories/services/cost-categories.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class CostCategoriesRootController {
  private readonly logger = new Logger(CostCategoriesRootController.name);

  constructor(private readonly service: CostCategoriesDomainService) {}

  // Returns paginated cost categories for the data table
  @MessagePattern({ cmd: 'org.costCategories.table' })
  async table(@Payload() state: TableState): Promise<{ result: CostCategoryDto[]; count: number }> {
    this.logger.log('costCategories.table');
    return this.service.findForTable(state);
  }

  // Returns cost categories matching an optional search term
  @MessagePattern({ cmd: 'org.costCategories.list' })
  async list(@Payload() data: { search?: string }): Promise<CostCategoryDto[]> {
    this.logger.log('costCategories.list');
    return this.service.list(data?.search);
  }

  // Creates a cost category
  @MessagePattern({ cmd: 'org.costCategories.create' })
  async create(@Payload() dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryDto>> {
    this.logger.log(`costCategories.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.service.create(dto);
  }

  // Returns a single cost category by ID
  @MessagePattern({ cmd: 'org.costCategories.findById' })
  async findById(@Payload() data: { id: string }): Promise<CostCategoryDto> {
    this.logger.log('costCategories.findById');
    return this.service.findById(data.id);
  }

  // Updates a cost category
  @MessagePattern({ cmd: 'org.costCategories.update' })
  async update(@Payload() dto: UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log('costCategories.update');
    return this.service.update(id, payload);
  }

  // Deactivates a cost category
  @MessagePattern({ cmd: 'org.costCategories.deactivate' })
  async deactivate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.deactivate');
    return this.service.deactivate(data.id);
  }

  // Activates a cost category
  @MessagePattern({ cmd: 'org.costCategories.activate' })
  async activate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.activate');
    return this.service.activate(data.id);
  }

  // Deletes a cost category
  @MessagePattern({ cmd: 'org.costCategories.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.delete');
    return this.service.delete(data.id);
  }
}
