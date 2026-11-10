import type { CreateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/create-tax-jurisdiction.dto';
import type { TaxJurisdictionSelectQueryDto } from '@commerce/tax-jurisdictions/dto/request/tax-jurisdiction-select-query.dto';
import type { TaxJurisdictionTreeQueryDto } from '@commerce/tax-jurisdictions/dto/request/tax-jurisdiction-tree-query.dto';
import type { UpdateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/update-tax-jurisdiction.dto';
import type { TaxJurisdictionChildrenTableResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-children-table-response.dto';
import type { TaxJurisdictionCountResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-count-response.dto';
import type { TaxJurisdictionResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-response.dto';
import type { TaxJurisdictionTreeResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-tree-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import type { SelectQueryResult } from '@vritti/api-sdk/select';

@Injectable()
export class TaxJurisdictionsGatewayService {
  private readonly logger = new Logger(TaxJurisdictionsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
  ) {}

  // Returns total tax jurisdiction count
  async count(): Promise<TaxJurisdictionCountResponseDto> {
    this.logger.log('org.taxJurisdictions.count');
    return this.nats.send('commerce', 'org.taxJurisdictions.count', {});
  }

  // Returns tax jurisdictions as tree hierarchy, states at the top grouped by country, optionally for one country
  async findTree(query: TaxJurisdictionTreeQueryDto): Promise<TaxJurisdictionTreeResponseDto[]> {
    this.logger.log(`org.taxJurisdictions.tree — country: ${query.country ?? 'all'}`);
    return this.nats.send('commerce', 'org.taxJurisdictions.tree', { search: query.search, country: query.country });
  }

  // Returns paginated child jurisdictions for a given parent ID
  async findChildrenForTable(userId: string, parentId: string): Promise<TaxJurisdictionChildrenTableResponseDto> {
    this.logger.log(`org.taxJurisdictions.childrenTable — parentId: ${parentId}`);
    const slug = `commerce-org-tax-jurisdiction-${parentId}-children`;
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, slug);
    const { result, count } = await this.nats.send<{ result: TaxJurisdictionResponseDto[]; count: number }>(
      'commerce',
      'org.taxJurisdictions.childrenTable',
      { parentId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Options for a jurisdiction picker, optionally of one country — the same select the session surface exposes,
  // reachable by cloud
  async findForSelect(query: TaxJurisdictionSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`select.taxJurisdictions — country: ${query.country ?? 'all'}`);
    return this.nats.send('commerce', 'select.taxJurisdictions', query);
  }

  // Creates a tax jurisdiction under a parent of the same country one level up
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
