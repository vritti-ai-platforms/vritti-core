import type { TaxGroupDto } from '@domain/tax-groups/dto/entity/tax-group.dto';
import { CreateTaxGroupDto } from '@domain/tax-groups/dto/request/create-tax-group.dto';
import { SetTaxGroupActiveDto } from '@domain/tax-groups/dto/request/set-tax-group-active.dto';
import { UpdateTaxGroupDto } from '@domain/tax-groups/dto/request/update-tax-group.dto';
import { TaxGroupsDomainService } from '@domain/tax-groups/services/tax-groups.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxGroupsRootController {
  private readonly logger = new Logger(TaxGroupsRootController.name);

  constructor(private readonly service: TaxGroupsDomainService) {}

  // Returns paginated tax groups for the data table, narrowed to the country in the table context
  @MessagePattern({ cmd: 'org.taxGroups.table' })
  async table(@Payload() state: TableState): Promise<{ result: TaxGroupDto[]; count: number }> {
    this.logger.log('taxGroups.table');
    return this.service.findForTable(state);
  }

  // Creates a tax group for one country
  @MessagePattern({ cmd: 'org.taxGroups.create' })
  async create(@Payload() dto: CreateTaxGroupDto): Promise<CreateResponseDto<TaxGroupDto>> {
    this.logger.log(`taxGroups.create — country: ${dto.countryCode}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Returns a tax group by ID
  @MessagePattern({ cmd: 'org.taxGroups.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxGroupDto> {
    this.logger.log(`taxGroups.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a tax group by ID; its country is fixed
  @MessagePattern({ cmd: 'org.taxGroups.update' })
  async update(@Payload() dto: UpdateTaxGroupDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Activates or deactivates a tax group
  @MessagePattern({ cmd: 'org.taxGroups.setActive' })
  async setActive(@Payload() dto: SetTaxGroupActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  // Deletes a tax group by ID
  @MessagePattern({ cmd: 'org.taxGroups.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxGroups.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
