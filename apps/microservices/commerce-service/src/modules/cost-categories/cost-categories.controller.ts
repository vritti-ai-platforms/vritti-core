import { CostCategoryDto } from '@domain/cost-categories/dto/entity/cost-category.dto';
import { CostCategoriesService } from '@domain/cost-categories/services/cost-categories.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
  TableViewState,
} from '@vritti/api-sdk';
import type { CreateCostCategoryDto } from './dto/request/create-cost-category.dto';
import type { UpdateCostCategoryDto } from './dto/request/update-cost-category.dto';

@Controller()
export class CostCategoriesController {
  private readonly logger = new Logger(CostCategoriesController.name);

  constructor(private readonly service: CostCategoriesService) {}

  @MessagePattern({ cmd: 'costCategories.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: CostCategoryDto[]; count: number }> {
    this.logger.log('costCategories.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'costCategories.select' })
  async select(@Payload() data: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('costCategories.select');
    return this.service.findForSelect(data);
  }

  @MessagePattern({ cmd: 'costCategories.list' })
  async list(@Payload() data: { search?: string }): Promise<CostCategoryDto[]> {
    this.logger.log('costCategories.list');
    return this.service.list(data?.search);
  }

  @MessagePattern({ cmd: 'costCategories.create' })
  async create(@Payload() dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryDto>> {
    this.logger.log(`costCategories.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'costCategories.findById' })
  async findById(@Payload() data: { id: string }): Promise<CostCategoryDto> {
    this.logger.log('costCategories.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'costCategories.update' })
  async update(@Payload() data: { id: string } & UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = data;
    this.logger.log('costCategories.update');
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'costCategories.deactivate' })
  async deactivate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.deactivate');
    return this.service.deactivate(data.id);
  }

  @MessagePattern({ cmd: 'costCategories.activate' })
  async activate(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.activate');
    return this.service.activate(data.id);
  }

  @MessagePattern({ cmd: 'costCategories.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.delete');
    return this.service.delete(data.id);
  }
}
