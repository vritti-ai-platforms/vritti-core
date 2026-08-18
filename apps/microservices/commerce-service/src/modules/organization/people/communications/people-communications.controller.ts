import type { PartyCommunicationDto } from '@domain/party-communications/dto/entity/party-communication.dto';
import { CreatePersonCommunicationDto } from '@domain/party-communications/dto/request/create-person-communication.dto';
import { FindPartiesByCommunicationDto } from '@domain/party-communications/dto/request/find-parties-by-communication.dto';
import { UpdateCommunicationDto } from '@domain/party-communications/dto/request/update-communication.dto';
import { PartyCommunicationsDomainService } from '@domain/party-communications/services/party-communications.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';

@Controller()
export class PeopleCommunicationsController {
  private readonly logger = new Logger(PeopleCommunicationsController.name);

  constructor(private readonly service: PartyCommunicationsDomainService) {}

  // Returns the paginated communications of a person
  @MessagePattern({ cmd: 'org.people.communications.table' })
  table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartyCommunicationDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.communications.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Resolves the people reachable at an email or phone, oldest party first. The caller
  // decides which match wins — several people can legitimately share an address.
  @MessagePattern({ cmd: 'org.people.communications.findByValue' })
  findByValue(@Payload() dto: FindPartiesByCommunicationDto): Promise<string[]> {
    this.logger.log(`people.communications.findByValue — channel: ${dto.channel}`);
    return this.service.findPartyIdsByValue(dto.channel, dto.value);
  }

  // Creates a communication for a person
  @MessagePattern({ cmd: 'org.people.communications.create' })
  create(@Payload() dto: CreatePersonCommunicationDto): Promise<CreateResponseDto<PartyCommunicationDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.communications.create — personId: ${personId}`);
    return this.service.create(personId, payload);
  }

  // Updates a communication by ID
  @MessagePattern({ cmd: 'org.people.communications.update' })
  update(@Payload() dto: UpdateCommunicationDto): Promise<SuccessResponseDto> {
    const { id, ...payload } = dto;
    this.logger.log(`people.communications.update — id: ${id}`);
    return this.service.update(id, payload);
  }

  // Deletes a communication by ID
  @MessagePattern({ cmd: 'org.people.communications.delete' })
  delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.communications.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
