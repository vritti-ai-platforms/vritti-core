import type { CreateCostCategoryDto } from '@commerce/cost-categories/dto/request/create-cost-category.dto';
import type { UpdateCostCategoryDto } from '@commerce/cost-categories/dto/request/update-cost-category.dto';
import type { CostCategoryResponseDto } from '@commerce/cost-categories/dto/response/cost-category-response.dto';
import type { CostCategoryTableResponseDto } from '@commerce/cost-categories/dto/response/cost-category-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Injectable()
export class CostCategoriesGatewayService {
  private readonly logger = new Logger(CostCategoriesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Returns paginated, filtered and sorted cost categories for the data table
  async findForTable(userId: string): Promise<CostCategoryTableResponseDto> {
    this.logger.log('org.costCategories.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-org-cost-categories');

    const { result, count } = await this.nats.send<{ result: CostCategoryResponseDto[]; count: number }>(
      'commerce',
      'org.costCategories.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns all cost categories (with canDelete) for the mobile plain list
  list(search?: string): Promise<CostCategoryResponseDto[]> {
    this.logger.log('org.costCategories.list');
    return this.nats.send('commerce', 'org.costCategories.list', { search });
  }

  // Finds a cost category by ID
  findById(id: string): Promise<CostCategoryResponseDto> {
    this.logger.log(`org.costCategories.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.costCategories.findById', { id });
  }

  // Creates a new cost category
  create(dto: CreateCostCategoryDto): Promise<CreateResponseDto<CostCategoryResponseDto>> {
    this.logger.log(`org.costCategories.create — code: ${dto.code}, kind: ${dto.kind}`);
    return this.nats.send('commerce', 'org.costCategories.create', dto);
  }

  // Updates a cost category by ID
  update(id: string, dto: UpdateCostCategoryDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.costCategories.update — id: ${id}`);
    return this.nats.send('commerce', 'org.costCategories.update', { id, ...dto });
  }

  // Deactivates a cost category by ID
  deactivate(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.costCategories.deactivate — id: ${id}`);
    return this.nats.send('commerce', 'org.costCategories.deactivate', { id });
  }

  // Activates a cost category by ID
  activate(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.costCategories.activate — id: ${id}`);
    return this.nats.send('commerce', 'org.costCategories.activate', { id });
  }

  // Deletes a cost category that is not system-reserved and no cost row references
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.costCategories.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.costCategories.delete', { id });
  }
}
