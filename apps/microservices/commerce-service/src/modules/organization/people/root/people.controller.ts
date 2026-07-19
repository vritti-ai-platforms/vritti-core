import type { PersonDto } from '@domain/parties/dto/entity/person.dto';
import { CreatePersonDto } from '@domain/parties/dto/request/create-person.dto';
import { UpdatePersonDto } from '@domain/parties/dto/request/update-person.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto, TableViewState } from '@vritti/api-sdk/database';
import { PeopleService } from './services/people-root.service';

@Controller()
export class PeopleController {
  private readonly logger = new Logger(PeopleController.name);

  constructor(private readonly service: PeopleService) {}

  // Returns paginated PERSON parties for the people table
  @MessagePattern({ cmd: 'org.people.table' })
  async table(@Payload() state: TableViewState): Promise<{ result: PersonDto[]; count: number }> {
    this.logger.log('people.table');
    return this.service.findForTable(state);
  }

  // Creates a PERSON party (display name derived from first/last) with an optional primary identifier
  @MessagePattern({ cmd: 'org.people.create' })
  async create(@Payload() dto: CreatePersonDto): Promise<CreateResponseDto<PersonDto>> {
    this.logger.log(`people.create — ${dto.firstName} ${dto.lastName ?? ''}`);
    return this.service.create(dto);
  }

  // Finds a person by ID
  @MessagePattern({ cmd: 'org.people.findById' })
  async findById(@Payload() data: { id: string }): Promise<PersonDto> {
    this.logger.log(`people.findById — id: ${data.id}`);
    return this.service.findById(data.id);
  }

  // Updates a person by ID
  @MessagePattern({ cmd: 'org.people.update' })
  async update(@Payload() dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`people.update — id: ${dto.id}`);
    return this.service.update(dto);
  }

  // Deletes a person by ID
  @MessagePattern({ cmd: 'org.people.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log(`people.delete — id: ${data.id}`);
    return this.service.delete(data.id);
  }
}
