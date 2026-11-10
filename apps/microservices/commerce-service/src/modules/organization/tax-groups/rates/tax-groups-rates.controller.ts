import type { TaxGroupRateDto } from '@domain/tax-groups/dto/entity/tax-group-rate.dto';
import { CreateTaxGroupRateDto } from '@domain/tax-groups/dto/request/create-tax-group-rate.dto';
import { UpdateTaxGroupRateDto } from '@domain/tax-groups/dto/request/update-tax-group-rate.dto';
import { TaxGroupRatesDomainService } from '@domain/tax-groups/services/tax-group-rates.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxGroupsRatesController {
  private readonly logger = new Logger(TaxGroupsRatesController.name);

  constructor(private readonly service: TaxGroupRatesDomainService) {}

  // Returns a group's paginated rates for the data table, optionally only those charged in a state on a day
  @MessagePattern({ cmd: 'org.taxGroups.rates.table' })
  async table(
    @Payload() data: { taxGroupId: string; jurisdiction?: string; asOf?: string } & TableState,
  ): Promise<{ result: TaxGroupRateDto[]; count: number }> {
    const { taxGroupId, jurisdiction, asOf, ...state } = data;
    this.logger.log(
      `taxGroups.rates.table — taxGroupId: ${taxGroupId}, jurisdiction: ${jurisdiction ?? 'all'}, asOf: ${asOf ?? 'any'}`,
    );
    return this.service.findForTable(taxGroupId, state, { jurisdictionId: jurisdiction, asOf });
  }

  // Adds a dated rate to a group
  @MessagePattern({ cmd: 'org.taxGroups.rates.create' })
  async create(@Payload() dto: CreateTaxGroupRateDto): Promise<CreateResponseDto<TaxGroupRateDto>> {
    this.logger.log(`taxGroups.rates.create — taxGroupId: ${dto.taxGroupId}, component: ${dto.taxComponentId}`);
    return this.service.create(dto);
  }

  // Updates a rate of a group
  @MessagePattern({ cmd: 'org.taxGroups.rates.update' })
  async update(@Payload() dto: UpdateTaxGroupRateDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.rates.update — taxGroupId: ${dto.taxGroupId}, id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Removes a rate from a group
  @MessagePattern({ cmd: 'org.taxGroups.rates.delete' })
  async delete(@Payload() data: { taxGroupId: string; id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.rates.delete — taxGroupId: ${data.taxGroupId}, id: ${data.id}`);
    return this.service.delete(data.taxGroupId, data.id);
  }
}
