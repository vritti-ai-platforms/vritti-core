import type { PartyCommunicationDto } from '@domain/party-communications/dto/entity/party-communication.dto';
import { CreateCompanyCommunicationDto } from '@domain/party-communications/dto/request/create-company-communication.dto';
import { UpdateCommunicationDto } from '@domain/party-communications/dto/request/update-communication.dto';
import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class CompanyCommunicationsController {
  private readonly logger = new Logger(CompanyCommunicationsController.name);

  constructor(private readonly service: PartyCommunicationsDomainService) {}

  // Returns the paginated communications of a company
  @MessagePattern({ cmd: 'org.companies.communications.table' })
  table(
    @Payload() data: { companyId: string } & TableViewState,
  ): Promise<{ result: PartyCommunicationDto[]; count: number }> {
    const { companyId, ...state } = data;
    this.logger.log(`companies.communications.table — companyId: ${companyId}`);
    return this.service.findForTable(companyId, state);
  }

  // Creates a communication for a company
  @MessagePattern({ cmd: 'org.companies.communications.create' })
  create(@Payload() dto: CreateCompanyCommunicationDto): Promise<CreateResponseDto<PartyCommunicationDto>> {
    const { companyId, ...payload } = dto;
    this.logger.log(`companies.communications.create — companyId: ${companyId}`);
    return this.service.create(companyId, payload);
  }

  // Updates a communication by ID
  @MessagePattern({ cmd: 'org.companies.communications.update' })
  update(@Payload() dto: UpdateCommunicationDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`companies.communications.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a communication by ID
  @MessagePattern({ cmd: 'org.companies.communications.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`companies.communications.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
