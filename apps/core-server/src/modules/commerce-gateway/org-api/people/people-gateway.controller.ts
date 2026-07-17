import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddPartyAddressDto } from './dto/request/add-party-address.dto';
import { AddPartyIdentifierDto } from './dto/request/add-party-identifier.dto';
import { CreatePersonDto } from './dto/request/create-person.dto';
import { UpdatePartyAddressDto } from './dto/request/update-party-address.dto';
import { UpdatePersonDto } from './dto/request/update-person.dto';
import type { PartyAddressResponseDto } from './dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from './dto/response/party-address-table-response.dto';
import type { PartyIdentifierResponseDto } from './dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from './dto/response/party-identifier-table-response.dto';
import type { PersonCompanyTableResponseDto } from './dto/response/person-company-table-response.dto';
import type { PersonResponseDto } from './dto/response/person-response.dto';
import type { PersonTableResponseDto } from './dto/response/person-table-response.dto';
import { PeopleGatewayService } from './services/people-gateway.service';

@ApiTags('Commerce - People')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_PEOPLE.featureCode)
@Controller('people')
export class PeopleGatewayController {
  private readonly logger = new Logger(PeopleGatewayController.name);

  constructor(private readonly service: PeopleGatewayService) {}

  // Returns paginated people for the data table
  @Get('table')
  @RequirePermission(ORG_PEOPLE.view)
  getTable(@UserId() userId: string): Promise<PersonTableResponseDto> {
    this.logger.log('GET /commerce-api/people/table');
    return this.service.findForTable(userId);
  }

  // Returns paginated person options for select dropdowns
  @Get('select')
  @RequirePermission(ORG_PEOPLE.view)
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/people/select');
    return this.service.select(query);
  }

  // Creates a new person
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePersonDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log('POST /commerce-api/people');
    return this.service.create(dto);
  }

  // Returns the identifiers of a person for the data table
  @Get(':id/identifiers')
  @RequirePermission(ORG_PEOPLE.view)
  listIdentifiers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/identifiers`);
    return this.service.listIdentifiers(id, userId);
  }

  // Returns the companies a person is linked to for the data table
  @Get(':id/companies')
  @RequirePermission(ORG_PEOPLE.view)
  getCompaniesTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PersonCompanyTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/companies`);
    return this.service.findCompaniesForTable(id, userId);
  }

  // Adds an identifier to a person
  @Post(':id/identifiers')
  @HttpCode(HttpStatus.CREATED)
  addIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyIdentifierDto,
  ): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/identifiers`);
    return this.service.addIdentifier(id, dto);
  }

  // Removes an identifier from a person
  @Delete(':id/identifiers/:identifierId')
  removeIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('identifierId', new ParseUUIDPipe()) identifierId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/identifiers/${identifierId}`);
    return this.service.removeIdentifier(identifierId);
  }

  // Returns the addresses of a person for the data table
  @Get(':id/addresses')
  @RequirePermission(ORG_PEOPLE.view)
  listAddresses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/addresses`);
    return this.service.listAddresses(id, userId);
  }

  // Adds an address to a person
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  addAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyAddressDto,
  ): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/addresses`);
    return this.service.addAddress(id, dto);
  }

  // Updates an address of a person
  @Patch(':id/addresses/:addressId')
  updateAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdatePartyAddressDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}/addresses/${addressId}`);
    return this.service.updateAddress(addressId, dto);
  }

  // Removes an address from a person
  @Delete(':id/addresses/:addressId')
  removeAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/addresses/${addressId}`);
    return this.service.removeAddress(addressId);
  }

  // Returns a person by ID
  @Get(':id')
  @RequirePermission(ORG_PEOPLE.view)
  findById(@Param('id') id: string): Promise<PersonResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}`);
    return this.service.findById(id);
  }

  // Updates a person by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a person by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}`);
    return this.service.delete(id);
  }
}
