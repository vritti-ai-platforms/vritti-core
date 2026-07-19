import type { TaxJurisdictionDto } from '@domain/tax-jurisdictions/dto/entity/tax-jurisdiction.dto';
import type { TaxJurisdictionCountDto } from '@domain/tax-jurisdictions/dto/entity/tax-jurisdiction-count.dto';
import type { TaxJurisdictionTreeDto } from '@domain/tax-jurisdictions/dto/entity/tax-jurisdiction-tree.dto';
import { CreateTaxJurisdictionDto } from '@domain/tax-jurisdictions/dto/request/create-tax-jurisdiction.dto';
import { UpdateTaxJurisdictionDto } from '@domain/tax-jurisdictions/dto/request/update-tax-jurisdiction.dto';
import { TaxJurisdictionsDomainService } from '@domain/tax-jurisdictions/services/tax-jurisdictions.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class TaxJurisdictionsController {
  private readonly logger = new Logger(TaxJurisdictionsController.name);

  constructor(private readonly service: TaxJurisdictionsDomainService) {}

  // Returns total tax-jurisdiction count
  @MessagePattern({ cmd: 'org.taxJurisdictions.count' })
  async count(): Promise<TaxJurisdictionCountDto> {
    this.logger.log('taxJurisdictions.count');
    return this.service.count();
  }

  // Returns tax jurisdictions as a tree hierarchy for TreeView
  @MessagePattern({ cmd: 'org.taxJurisdictions.tree' })
  async tree(@Payload() data?: { search?: string }): Promise<TaxJurisdictionTreeDto[]> {
    this.logger.log('taxJurisdictions.tree');
    return this.service.tree(data?.search);
  }

  // Returns paginated child jurisdictions for a given parent ID
  @MessagePattern({ cmd: 'org.taxJurisdictions.childrenTable' })
  async childrenTable(
    @Payload() data: { parentId: string } & TableViewState,
  ): Promise<{ result: TaxJurisdictionDto[]; count: number }> {
    this.logger.log(`taxJurisdictions.childrenTable — parentId: ${data.parentId}`);
    return this.service.findChildrenForTable(data.parentId, data);
  }

  // Creates a new tax jurisdiction (org_id auto-filled by DB defaults from session vars)
  @MessagePattern({ cmd: 'org.taxJurisdictions.create' })
  async create(@Payload() dto: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionDto>> {
    this.logger.log(`taxJurisdictions.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Finds a tax jurisdiction by ID (RLS scopes visibility)
  @MessagePattern({ cmd: 'org.taxJurisdictions.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxJurisdictionDto> {
    this.logger.log(`taxJurisdictions.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a tax jurisdiction by ID
  @MessagePattern({ cmd: 'org.taxJurisdictions.update' })
  async update(@Payload() dto: UpdateTaxJurisdictionDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxJurisdictions.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a tax jurisdiction by ID
  @MessagePattern({ cmd: 'org.taxJurisdictions.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxJurisdictions.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
