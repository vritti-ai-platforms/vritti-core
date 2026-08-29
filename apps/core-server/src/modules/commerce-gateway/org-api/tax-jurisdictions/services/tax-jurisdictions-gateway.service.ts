import type { CreateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/create-tax-jurisdiction.dto';
import type { UpdateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/update-tax-jurisdiction.dto';
import type { TaxJurisdictionChildrenTableResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-children-table-response.dto';
import type { TaxJurisdictionCountResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-count-response.dto';
import type { TaxJurisdictionResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-response.dto';
import type { TaxJurisdictionTreeResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-tree-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class TaxJurisdictionsGatewayService {
  private readonly logger = new Logger(TaxJurisdictionsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns total tax jurisdiction count
  async count(): Promise<TaxJurisdictionCountResponseDto> {
    this.logger.log('org.taxJurisdictions.count');
    return this.nats.send('commerce', 'org.taxJurisdictions.count', {});
  }

  // Returns tax jurisdictions as tree hierarchy
  async findTree(search?: string): Promise<TaxJurisdictionTreeResponseDto[]> {
    this.logger.log('org.taxJurisdictions.tree');
    return this.nats.send('commerce', 'org.taxJurisdictions.tree', { search });
  }

  // Returns paginated child jurisdictions for a given parent ID
  async findChildrenForTable(userId: string, parentId: string): Promise<TaxJurisdictionChildrenTableResponseDto> {
    this.logger.log(`org.taxJurisdictions.childrenTable — parentId: ${parentId}`);
    const slug = `commerce-org-tax-jurisdiction-${parentId}-children`;
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, slug);
    const { result, count } = await this.nats.send<{ result: TaxJurisdictionResponseDto[]; count: number }>(
      'commerce',
      'org.taxJurisdictions.childrenTable',
      { parentId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Creates a new tax jurisdiction
  async create(dto: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionResponseDto>> {
    this.logger.log(`org.taxJurisdictions.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'org.taxJurisdictions.create', dto);
  }

  // Finds a tax jurisdiction by ID
  async findById(id: string): Promise<TaxJurisdictionResponseDto> {
    this.logger.log(`org.taxJurisdictions.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.taxJurisdictions.findById', { id });
  }

  // Updates a tax jurisdiction by ID
  async update(id: string, dto: UpdateTaxJurisdictionDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxJurisdictions.update — id: ${id}`);
    return this.nats.send('commerce', 'org.taxJurisdictions.update', { id, ...dto });
  }

  // Deletes a tax jurisdiction by ID
  async delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.taxJurisdictions.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.taxJurisdictions.delete', { id });
  }
}
