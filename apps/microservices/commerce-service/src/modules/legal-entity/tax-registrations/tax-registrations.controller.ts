import type { TaxRegistrationDto } from '@domain/tax-registrations/dto/entity/tax-registration.dto';
import { CreateTaxRegistrationDto } from '@domain/tax-registrations/dto/request/create-tax-registration.dto';
import { UpdateTaxRegistrationDto } from '@domain/tax-registrations/dto/request/update-tax-registration.dto';
import { TaxRegistrationsDomainService } from '@domain/tax-registrations/services/tax-registrations.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class TaxRegistrationsController {
  private readonly logger = new Logger(TaxRegistrationsController.name);

  constructor(private readonly service: TaxRegistrationsDomainService) {}

  @MessagePattern({ cmd: 'le.taxRegistrations.table' })
  table(@Payload() state: TableViewState): Promise<{ result: TaxRegistrationDto[]; count: number }> {
    this.logger.log('taxRegistrations.table');
    return this.service.findForTable(state);
  }

  // Every registration a legal entity holds — the origin GSTIN/VAT set tax resolution reads from
  @MessagePattern({ cmd: 'le.taxRegistrations.list' })
  list(@Payload() data: { legalEntityId: string }): Promise<TaxRegistrationDto[]> {
    this.logger.log(`taxRegistrations.list — legalEntityId: ${data.legalEntityId}`);
    return this.service.listByLegalEntity(data.legalEntityId);
  }

  // The whole organization's registrations, for the cloud structure aggregate
  @MessagePattern({ cmd: 'le.taxRegistrations.listAll' })
  listAll(): Promise<TaxRegistrationDto[]> {
    this.logger.log('taxRegistrations.listAll');
    return this.service.listAll();
  }

  @MessagePattern({ cmd: 'le.taxRegistrations.get' })
  findById(@Payload() data: { id: string }): Promise<TaxRegistrationDto> {
    this.logger.log(`taxRegistrations.get — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'le.taxRegistrations.create' })
  create(@Payload() dto: CreateTaxRegistrationDto): Promise<CreateResponseDto<TaxRegistrationDto>> {
    this.logger.log(`taxRegistrations.create — number: ${dto.registrationNumber}`);
    return this.service.create(dto);
  }

  @MessagePattern({ cmd: 'le.taxRegistrations.update' })
  update(@Payload() dto: UpdateTaxRegistrationDto & { id: string }): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`taxRegistrations.update — id: ${id}`);
    return this.service.update(id, data);
  }

  @MessagePattern({ cmd: 'le.taxRegistrations.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`taxRegistrations.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
