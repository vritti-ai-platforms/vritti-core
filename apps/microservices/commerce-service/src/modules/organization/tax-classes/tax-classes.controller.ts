import { TaxClassDto } from '@domain/tax-classes/dto/entity/tax-class.dto';
import { TaxClassesService } from '@domain/tax-classes/services/tax-classes.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { CreateTaxClassDto } from './dto/request/create-tax-class.dto';
import { UpdateTaxClassDto } from './dto/request/update-tax-class.dto';

@Controller()
export class TaxClassesController {
  private readonly logger = new Logger(TaxClassesController.name);

  constructor(private readonly service: TaxClassesService) {}

  @MessagePattern({ cmd: 'org.taxClasses.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: TaxClassDto[]; count: number }> {
    this.logger.log('taxClasses.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'org.taxClasses.create' })
  async create(@Payload() dto: CreateTaxClassDto): Promise<CreateResponseDto<TaxClassDto>> {
    this.logger.log(`taxClasses.create — code: ${dto.code}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'org.taxClasses.findById' })
  async findById(@Payload() data: { id: string }): Promise<TaxClassDto> {
    this.logger.log(`taxClasses.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'org.taxClasses.update' })
  async update(@Payload() dto: UpdateTaxClassDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`taxClasses.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  @MessagePattern({ cmd: 'org.taxClasses.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxClasses.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
