import { TaxComponentDto } from '@domain/tax-components/dto/entity/tax-component.dto';
import { CreateTaxComponentDto } from '@domain/tax-components/dto/request/create-tax-component.dto';
import { SetTaxComponentActiveDto } from '@domain/tax-components/dto/request/set-tax-component-active.dto';
import { UpdateTaxComponentDto } from '@domain/tax-components/dto/request/update-tax-component.dto';
import { TaxComponentsDomainService } from '@domain/tax-components/services/tax-components.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxComponentsController {
  private readonly logger = new Logger(TaxComponentsController.name);

  constructor(private readonly service: TaxComponentsDomainService) {}

  // Returns paginated tax components for the data table, narrowed to the country in the table context if any
  @MessagePattern({ cmd: 'org.taxComponents.table' })
  async table(@Payload() state: TableState): Promise<{ result: TaxComponentDto[]; count: number }> {
    this.logger.log('taxComponents.table');
    return this.service.findForTable(state);
  }

  // Creates a tax component for one country
  @MessagePattern({ cmd: 'org.taxComponents.create' })
  async create(@Payload() dto: CreateTaxComponentDto): Promise<CreateResponseDto<TaxComponentDto>> {
    this.logger.log(`taxComponents.create — country: ${dto.countryCode}, code: ${dto.code}`);
    return this.service.create(dto);
  }

  // Returns a tax component by ID
  @MessagePattern({ cmd: 'org.taxComponents.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxComponentDto> {
    this.logger.log(`taxComponents.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a tax component by ID
  @MessagePattern({ cmd: 'org.taxComponents.update' })
  async update(@Payload() dto: UpdateTaxComponentDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxComponents.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a tax component by ID
  @MessagePattern({ cmd: 'org.taxComponents.setActive' })
  async setActive(@Payload() dto: SetTaxComponentActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxComponents.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  @MessagePattern({ cmd: 'org.taxComponents.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxComponents.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
