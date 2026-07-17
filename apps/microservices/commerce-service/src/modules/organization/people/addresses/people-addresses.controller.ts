import { PartyAddressDto } from '@domain/party-addresses/dto/entity/party-address.dto';
import { PartyAddressesService } from '@domain/party-addresses/services/party-addresses.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { AddPersonAddressDto } from './dto/request/add-person-address.dto';
import { UpdateAddressDto } from './dto/request/update-address.dto';

@Controller()
export class PeopleAddressesController {
  private readonly logger = new Logger(PeopleAddressesController.name);

  constructor(private readonly service: PartyAddressesService) {}

  // Returns the paginated addresses of a person
  @MessagePattern({ cmd: 'org.people.addresses.table' })
  async table(
    @Payload() data: { personId: string } & TableViewState,
  ): Promise<{ result: PartyAddressDto[]; count: number }> {
    const { personId, ...state } = data;
    this.logger.log(`people.addresses.table — personId: ${personId}`);
    return this.service.findForTable(personId, state);
  }

  // Adds an address to a person
  @MessagePattern({ cmd: 'org.people.addresses.add' })
  async add(@Payload() dto: AddPersonAddressDto): Promise<CreateResponseDto<PartyAddressDto>> {
    const { personId, ...payload } = dto;
    this.logger.log(`people.addresses.add — personId: ${personId}`);
    return this.service.add(personId, payload);
  }

  // Updates an address by ID
  @MessagePattern({ cmd: 'org.people.addresses.update' })
  async update(@Payload() dto: UpdateAddressDto): Promise<SuccessResponseDto> {
    const { id, ...data } = dto;
    this.logger.log(`people.addresses.update — id: ${id}`);
    return this.service.update(id, data);
  }

  // Removes an address by ID
  @MessagePattern({ cmd: 'org.people.addresses.remove' })
  async remove(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.addresses.remove — id: ${data.id}`);
    return this.service.remove(data.id);
  }
}
