import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateCostCategoryDto } from '../dto/request/create-cost-category.dto';
import type { UpdateCostCategoryDto } from '../dto/request/update-cost-category.dto';
import type { CostCategoryResponseDto } from '../dto/response/cost-category-response.dto';
import type { CostCategoryTableResponseDto } from '../dto/response/cost-category-table-response.dto';

@Injectable()
export class CostCategoriesGatewayService {
  private readonly logger = new Logger(CostCategoriesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  async findForTable(userId: string): Promise<CostCategoryTableResponseDto> {
    this.logger.log('costCategories.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      'commerce-cost-categories',
    );

    const { result, count } = await this.nats.send<{ result: CostCategoryResponseDto[]; count: number }>(
      'commerce',
      'costCategories.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  async create(dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryResponseDto>> {
    this.logger.log(`costCategories.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.nats.send('commerce', 'le.costCategories.create', dto);
  }

  async findById(id: string): Promise<CostCategoryResponseDto> {
    this.logger.log('costCategories.findById');
    return this.nats.send('commerce', 'le.costCategories.findById', { id });
  }

  async update(id: string, dto: UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.update');
    return this.nats.send('commerce', 'le.costCategories.update', { id, ...dto });
  }

  async deactivate(id: string): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.deactivate');
    return this.nats.send('commerce', 'le.costCategories.deactivate', { id });
  }

  async activate(id: string): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.activate');
    return this.nats.send('commerce', 'le.costCategories.activate', { id });
  }

  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log('costCategories.delete');
    return this.nats.send('commerce', 'le.costCategories.delete', { id });
  }
}
