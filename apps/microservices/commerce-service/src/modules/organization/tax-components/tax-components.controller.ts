import { TaxComponentDto } from '@domain/tax-components/dto/entity/tax-component.dto';
import { TaxComponentsService } from '@domain/tax-components/services/tax-components.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CreateTaxComponentDto } from './dto/request/create-tax-component.dto';
import { UpdateTaxComponentDto } from './dto/request/update-tax-component.dto';

@Controller()
export class TaxComponentsController {
  private readonly logger = new Logger(TaxComponentsController.name);

  constructor(private readonly service: TaxComponentsService) {}

  @MessagePattern({ cmd: 'org.taxComponents.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: TaxComponentDto[]; count: number }> {
    this.logger.log('taxComponents.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.taxComponents.create' })
  async create(@Payload() dto: CreateTaxComponentDto): Promise<CreateResponseDto<TaxComponentDto>> {
    this.logger.log(`taxComponents.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.taxComponents.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxComponentDto> {
    this.logger.log(`taxComponents.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.taxComponents.update' })
  async update(@Payload() dto: UpdateTaxComponentDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxComponents.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.taxComponents.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxComponents.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
