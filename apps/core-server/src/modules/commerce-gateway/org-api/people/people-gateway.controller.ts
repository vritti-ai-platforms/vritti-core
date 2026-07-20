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
import { CreatePartyBankAccountDto } from './dto/request/create-party-bank-account.dto';
import { CreatePartyContactDto } from './dto/request/create-party-contact.dto';
import { CreatePartyLicenseDto } from './dto/request/create-party-license.dto';
import { CreatePersonDto } from './dto/request/create-person.dto';
import { CreatePersonRegistrationDto } from './dto/request/create-person-registration.dto';
import { UpdatePartyAddressDto } from './dto/request/update-party-address.dto';
import { UpdatePartyBankAccountDto } from './dto/request/update-party-bank-account.dto';
import { UpdatePartyContactDto } from './dto/request/update-party-contact.dto';
import { UpdatePartyLicenseDto } from './dto/request/update-party-license.dto';
import { UpdatePersonDto } from './dto/request/update-person.dto';
import { UpdatePersonRegistrationDto } from './dto/request/update-person-registration.dto';
import type { PartyAddressResponseDto } from './dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from './dto/response/party-address-table-response.dto';
import type { PartyBankAccountResponseDto } from './dto/response/party-bank-account-response.dto';
import type { PartyBankAccountTableResponseDto } from './dto/response/party-bank-account-table-response.dto';
import type { PartyContactResponseDto } from './dto/response/party-contact-response.dto';
import type { PartyContactTableResponseDto } from './dto/response/party-contact-table-response.dto';
import type { PartyIdentifierResponseDto } from './dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from './dto/response/party-identifier-table-response.dto';
import type { PartyLicenseResponseDto } from './dto/response/party-license-response.dto';
import type { PartyLicenseTableResponseDto } from './dto/response/party-license-table-response.dto';
import type { PersonCompanyTableResponseDto } from './dto/response/person-company-table-response.dto';
import type { PersonRegistrationResponseDto } from './dto/response/person-registration-response.dto';
import type { PersonRegistrationTableResponseDto } from './dto/response/person-registration-table-response.dto';
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
  @RequirePermission(ORG_PEOPLE.add)
  create(@Body() dto: CreatePersonDto): Promise<CreateResponseDto<PersonResponseDto>> {
    this.logger.log('POST /commerce-api/people');
    return this.service.create(dto);
  }

  // Returns the identifiers of a person for the data table
  @Get(':id/identifiers/table')
  @RequirePermission(ORG_PEOPLE.identifiers.view)
  listIdentifiers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/identifiers/table`);
    return this.service.listIdentifiers(id, userId);
  }

  // Returns the companies a person is linked to for the data table
  @Get(':id/companies/table')
  @RequirePermission(ORG_PEOPLE.companies.view)
  getCompaniesTable(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PersonCompanyTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/companies/table`);
    return this.service.findCompaniesForTable(id, userId);
  }

  // Adds an identifier to a person
  @Post(':id/identifiers')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.identifiers.add)
  addIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyIdentifierDto,
  ): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/identifiers`);
    return this.service.addIdentifier(id, dto);
  }

  // Removes an identifier from a person
  @Delete(':id/identifiers/:identifierId')
  @RequirePermission(ORG_PEOPLE.identifiers.delete)
  removeIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('identifierId', new ParseUUIDPipe()) identifierId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/identifiers/${identifierId}`);
    return this.service.removeIdentifier(identifierId);
  }

  // Returns the addresses of a person for the data table
  @Get(':id/addresses/table')
  @RequirePermission(ORG_PEOPLE.addresses.view)
  listAddresses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/addresses/table`);
    return this.service.listAddresses(id, userId);
  }

  // Adds an address to a person
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.addresses.add)
  addAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyAddressDto,
  ): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/addresses`);
    return this.service.addAddress(id, dto);
  }

  // Updates an address of a person
  @Patch(':id/addresses/:addressId')
  @RequirePermission(ORG_PEOPLE.addresses.edit)
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
  @RequirePermission(ORG_PEOPLE.addresses.delete)
  removeAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/addresses/${addressId}`);
    return this.service.removeAddress(addressId);
  }

  // Returns the tax registrations of a person for the data table
  @Get(':id/registrations/table')
  @RequirePermission(ORG_PEOPLE.registrations.view)
  listRegistrations(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PersonRegistrationTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/registrations/table`);
    return this.service.listRegistrations(id, userId);
  }

  // Creates a tax registration for a person
  @Post(':id/registrations')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.registrations.add)
  createRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePersonRegistrationDto,
  ): Promise<CreateResponseDto<PersonRegistrationResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/registrations`);
    return this.service.createRegistration(id, dto);
  }

  // Updates a person tax registration
  @Patch(':id/registrations/:registrationId')
  @RequirePermission(ORG_PEOPLE.registrations.edit)
  updateRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
    @Body() dto: UpdatePersonRegistrationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}/registrations/${registrationId}`);
    return this.service.updateRegistration(registrationId, dto);
  }

  // Deletes a person tax registration
  @Delete(':id/registrations/:registrationId')
  @RequirePermission(ORG_PEOPLE.registrations.delete)
  deleteRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/registrations/${registrationId}`);
    return this.service.deleteRegistration(registrationId);
  }

  // Returns the licenses of a person for the data table
  @Get(':id/licenses/table')
  @RequirePermission(ORG_PEOPLE.licenses.view)
  listLicenses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyLicenseTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/licenses/table`);
    return this.service.listLicenses(id, userId);
  }

  // Creates a license for a person
  @Post(':id/licenses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.licenses.add)
  createLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyLicenseDto,
  ): Promise<CreateResponseDto<PartyLicenseResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/licenses`);
    return this.service.createLicense(id, dto);
  }

  // Updates a person license
  @Patch(':id/licenses/:licenseId')
  @RequirePermission(ORG_PEOPLE.licenses.edit)
  updateLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('licenseId', new ParseUUIDPipe()) licenseId: string,
    @Body() dto: UpdatePartyLicenseDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}/licenses/${licenseId}`);
    return this.service.updateLicense(licenseId, dto);
  }

  // Deletes a person license
  @Delete(':id/licenses/:licenseId')
  @RequirePermission(ORG_PEOPLE.licenses.delete)
  deleteLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('licenseId', new ParseUUIDPipe()) licenseId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/licenses/${licenseId}`);
    return this.service.deleteLicense(licenseId);
  }

  // Returns the bank accounts of a person for the data table
  @Get(':id/bank-accounts/table')
  @RequirePermission(ORG_PEOPLE.bankAccounts.view)
  listBankAccounts(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyBankAccountTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/bank-accounts/table`);
    return this.service.listBankAccounts(id, userId);
  }

  // Creates a bank account for a person
  @Post(':id/bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.bankAccounts.add)
  createBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyBankAccountDto,
  ): Promise<CreateResponseDto<PartyBankAccountResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/bank-accounts`);
    return this.service.createBankAccount(id, dto);
  }

  // Updates a person bank account
  @Patch(':id/bank-accounts/:accountId')
  @RequirePermission(ORG_PEOPLE.bankAccounts.edit)
  updateBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
    @Body() dto: UpdatePartyBankAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}/bank-accounts/${accountId}`);
    return this.service.updateBankAccount(accountId, dto);
  }

  // Deletes a person bank account
  @Delete(':id/bank-accounts/:accountId')
  @RequirePermission(ORG_PEOPLE.bankAccounts.delete)
  deleteBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/bank-accounts/${accountId}`);
    return this.service.deleteBankAccount(accountId);
  }

  // Returns the contacts of a person for the data table
  @Get(':id/contacts/table')
  @RequirePermission(ORG_PEOPLE.contacts.view)
  listContacts(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyContactTableResponseDto> {
    this.logger.log(`GET /commerce-api/people/${id}/contacts/table`);
    return this.service.listContacts(id, userId);
  }

  // Creates a contact for a person
  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_PEOPLE.contacts.add)
  createContact(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyContactDto,
  ): Promise<CreateResponseDto<PartyContactResponseDto>> {
    this.logger.log(`POST /commerce-api/people/${id}/contacts`);
    return this.service.createContact(id, dto);
  }

  // Updates a person contact
  @Patch(':id/contacts/:contactId')
  @RequirePermission(ORG_PEOPLE.contacts.edit)
  updateContact(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
    @Body() dto: UpdatePartyContactDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}/contacts/${contactId}`);
    return this.service.updateContact(contactId, dto);
  }

  // Deletes a person contact
  @Delete(':id/contacts/:contactId')
  @RequirePermission(ORG_PEOPLE.contacts.delete)
  deleteContact(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('contactId', new ParseUUIDPipe()) contactId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}/contacts/${contactId}`);
    return this.service.deleteContact(contactId);
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
  @RequirePermission(ORG_PEOPLE.edit)
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/people/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a person by ID
  @Delete(':id')
  @RequirePermission(ORG_PEOPLE.delete)
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/people/${id}`);
    return this.service.delete(id);
  }
}
