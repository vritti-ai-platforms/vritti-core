import { TaxClassDto } from '@domain/tax-classes/dto/entity/tax-class.dto';
import type { TaxClassCountsDto } from '@domain/tax-classes/dto/entity/tax-class-counts.dto';
import type { TaxClassTableRowDto } from '@domain/tax-classes/dto/entity/tax-class-table-row.dto';
import { CreateTaxClassDto } from '@domain/tax-classes/dto/request/create-tax-class.dto';
import { SetTaxClassActiveDto } from '@domain/tax-classes/dto/request/set-tax-class-active.dto';
import { UpdateTaxClassDto } from '@domain/tax-classes/dto/request/update-tax-class.dto';
import { TaxClassesDomainService } from '@domain/tax-classes/services/tax-classes.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';

@Controller()
export class TaxClassesController {
  private readonly logger = new Logger(TaxClassesController.name);

  constructor(private readonly service: TaxClassesDomainService) {}

  @MessagePattern({ cmd: 'org.taxClasses.create' })
  async create(@Payload() dto: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassDto>> {
    this.logger.log(`taxClasses.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.taxClasses.update' })
  async update(@Payload() dto: UpdateTaxClassDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxClasses.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.taxClasses.setActive' })
  async setActive(@Payload() dto: SetTaxClassActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  @MessagePattern({ cmd: 'org.taxClasses.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxClassDto> {
    this.logger.log(`taxClasses.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.taxClasses.table' })
  async table(@Payload() state: TableState): Promise<{ result: TaxClassTableRowDto[]; count: number }> {
    this.logger.log('taxClasses.table');
    return this.service.findForTable(state);
  }

  // Counts a tax class's group mappings, one per tab of its detail page
  @MessagePattern({ cmd: 'org.taxClasses.findCounts' })
  async findCounts(@Payload() data: { id: string }): Promise<TaxClassCountsDto> {
    this.logger.log(`taxClasses.findCounts — id: ${data.id}`);
    return this.service.findCounts(data.id);
  }

  @MessagePattern({ cmd: 'org.taxClasses.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
