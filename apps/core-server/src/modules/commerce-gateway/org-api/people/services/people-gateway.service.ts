import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService } from '@vritti/api-sdk/data-table';
import type {
  CreateResponseDto,
  SelectOptionsQueryDto,
  SelectQueryResult,
  SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { AddPartyAddressDto } from '../dto/request/add-party-address.dto';
import type { AddPartyIdentifierDto } from '../dto/request/add-party-identifier.dto';
import type { CreatePersonDto } from '../dto/request/create-person.dto';
import type { UpdatePartyAddressDto } from '../dto/request/update-party-address.dto';
import type { UpdatePersonDto } from '../dto/request/update-person.dto';
import type { PartyAddressResponseDto } from '../dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from '../dto/response/party-address-table-response.dto';
import type { PartyIdentifierResponseDto } from '../dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from '../dto/response/party-identifier-table-response.dto';
import type { PersonCompanyResponseDto } from '../dto/response/person-company-response.dto';
import type { PersonCompanyTableResponseDto } from '../dto/response/person-company-table-response.dto';
import type { PersonResponseDto } from '../dto/response/person-response.dto';
import type { PersonTableResponseDto } from '../dto/response/person-table-response.dto';

@Injectable()
export class PeopleGatewayService {
  private readonly logger = new Logger(PeopleGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Returns paginated, filtered, and sorted people for the data table
  async findForTable(userId: string): Promise<PersonTableResponseDto> {
    this.logger.log('org.people.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-org-people');

    const { result, count } = await this.nats.send<{ result: PersonResponseDto[]; count: number }>(
      'commerce',
      'org.people.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns paginated person options for select dropdowns
  select(params: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('select.people');
    return this.nats.send('commerce', 'select.people', params);
  }

  // Creates a new person
  create(dto: CreatePersonDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log(`org.people.create — firstName: ${dto.firstName}`);
    return this.nats.send('commerce', 'org.people.create', dto);
  }

  // Finds a person by ID
  findById(id: string): Promise<PersonResponseDto> {
    this.logger.log(`org.people.findById — id: ${id}`);
    return this.nats.send('commerce', 'org.people.findById', { id });
  }

  // Updates a person by ID
  update(id: string, dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.update — id: ${id}`);
    return this.nats.send('commerce', 'org.people.update', { id, ...dto });
  }

  // Deletes a person by ID
  delete(id: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.delete — id: ${id}`);
    return this.nats.send('commerce', 'org.people.delete', { id });
  }

  // Returns the identifiers of a person for the data table
  async listIdentifiers(personId: string, userId: string): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`org.people.identifiers.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-identifiers`,
    );

    const { result, count } = await this.nats.send<{ result: PartyIdentifierResponseDto[]; count: number }>(
      'commerce',
      'org.people.identifiers.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Returns the companies a person is linked to for the data table
  async findCompaniesForTable(personId: string, userId: string): Promise<PersonCompanyTableResponseDto> {
    this.logger.log(`org.people.companies.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-companies`,
    );

    const { result, count } = await this.nats.send<{ result: PersonCompanyResponseDto[]; count: number }>(
      'commerce',
      'org.people.companies.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an identifier to a person
  addIdentifier(personId: string, dto: AddPartyIdentifierDto): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`org.people.identifiers.add — personId: ${personId}, idType: ${dto.idType}`);
    return this.nats.send('commerce', 'org.people.identifiers.add', { personId, ...dto });
  }

  // Removes an identifier from a person
  removeIdentifier(identifierId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.identifiers.remove — id: ${identifierId}`);
    return this.nats.send('commerce', 'org.people.identifiers.remove', { id: identifierId });
  }

  // Returns the addresses of a person for the data table
  async listAddresses(personId: string, userId: string): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`org.people.addresses.table — personId: ${personId}`);
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(
      userId,
      `commerce-org-person-${personId}-addresses`,
    );

    const { result, count } = await this.nats.send<{ result: PartyAddressResponseDto[]; count: number }>(
      'commerce',
      'org.people.addresses.table',
      { personId, ...state },
    );

    return { result, count, state, activeViewId };
  }

  // Adds an address to a person
  addAddress(personId: string, dto: AddPartyAddressDto): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`org.people.addresses.add — personId: ${personId}, type: ${dto.type}`);
    return this.nats.send('commerce', 'org.people.addresses.add', { personId, ...dto });
  }

  // Updates an address of a person by ID
  updateAddress(addressId: string, dto: UpdatePartyAddressDto): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.addresses.update — id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.update', { id: addressId, ...dto });
  }

  // Removes an address from a person
  removeAddress(addressId: string): Promise<SuccessResponseDto> {
    this.logger.log(`org.people.addresses.remove — id: ${addressId}`);
    return this.nats.send('commerce', 'org.people.addresses.remove', { id: addressId });
  }
}
