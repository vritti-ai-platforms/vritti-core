import { CostCategoryDto } from '@domain/cost-categories/dto/entity/cost-category.dto';
import { CostCategoriesService } from '@domain/cost-categories/services/cost-categories.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk/database';
import { CreateCostCategoryDto } from './dto/request/create-cost-category.dto';
import { UpdateCostCategoryDto } from './dto/request/update-cost-category.dto';

@Controller()
export class CostCategoriesController {
  private readonly logger = new Logger(CostCategoriesController.name);

  constructor(private readonly service: CostCategoriesService) {}

  @MessagePattern({ cmd: 'le.costCategories.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CostCategoryDto[]; count: number }> {
    this.logger.log('costCategories.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'le.costCategories.list' })
  async list(@Payload() data: { search?: string }): Promise<CostCategoryDto[]> {
    this.logger.log('costCategories.list');
    return this.service.list(data?.search);
  }

  @MessagePattern({ cmd: 'le.costCategories.create' })
  async create(@Payload() dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryDto>> {
    this.logger.log(`costCategories.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'le.costCategories.findById' })
  async findById(@Payload() data: { id: string }): Promise<CostCategoryDto> {
    this.logger.log('costCategories.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'le.costCategories.update' })
  async update(@Payload() dto: UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log('costCategories.update');
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'le.costCategories.deactivate' })
  async deactivate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.deactivate');
    return this.service.deactivate(data.id);
  }

  @MessagePattern({ cmd: 'le.costCategories.activate' })
  async activate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.activate');
    return this.service.activate(data.id);
  }

  @MessagePattern({ cmd: 'le.costCategories.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.delete');
    return this.service.delete(data.id);
  }
}
