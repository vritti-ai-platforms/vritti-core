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
import { ORG_COMPANIES } from '@vritti/commerce-permissions/companies';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import { AddCompanyPersonDto } from './dto/request/add-company-person.dto';
import { AddPartyAddressDto } from './dto/request/add-party-address.dto';
import { AddPartyIdentifierDto } from './dto/request/add-party-identifier.dto';
import { CreateCompanyDto } from './dto/request/create-company.dto';
import { CreateCompanyRegistrationDto } from './dto/request/create-company-registration.dto';
import { CreatePartyBankAccountDto } from './dto/request/create-party-bank-account.dto';
import { CreatePartyCommunicationDto } from './dto/request/create-party-communication.dto';
import { CreatePartyLicenseDto } from './dto/request/create-party-license.dto';
import { CreatePartySocialProfileDto } from './dto/request/create-party-social-profile.dto';
import { UpdateCompanyDto } from './dto/request/update-company.dto';
import { UpdateCompanyPersonDto } from './dto/request/update-company-person.dto';
import { UpdateCompanyRegistrationDto } from './dto/request/update-company-registration.dto';
import { UpdatePartyAddressDto } from './dto/request/update-party-address.dto';
import { UpdatePartyBankAccountDto } from './dto/request/update-party-bank-account.dto';
import { UpdatePartyCommunicationDto } from './dto/request/update-party-communication.dto';
import { UpdatePartyLicenseDto } from './dto/request/update-party-license.dto';
import { UpdatePartySocialProfileDto } from './dto/request/update-party-social-profile.dto';
import type { CompanyPersonResponseDto } from './dto/response/company-person-response.dto';
import type { CompanyPersonTableResponseDto } from './dto/response/company-person-table-response.dto';
import type { CompanyRegistrationResponseDto } from './dto/response/company-registration-response.dto';
import type { CompanyRegistrationTableResponseDto } from './dto/response/company-registration-table-response.dto';
import type { CompanyResponseDto } from './dto/response/company-response.dto';
import type { CompanyTableResponseDto } from './dto/response/company-table-response.dto';
import type { PartyAddressResponseDto } from './dto/response/party-address-response.dto';
import type { PartyAddressTableResponseDto } from './dto/response/party-address-table-response.dto';
import type { PartyBankAccountResponseDto } from './dto/response/party-bank-account-response.dto';
import type { PartyBankAccountTableResponseDto } from './dto/response/party-bank-account-table-response.dto';
import type { PartyCommunicationResponseDto } from './dto/response/party-communication-response.dto';
import type { PartyCommunicationTableResponseDto } from './dto/response/party-communication-table-response.dto';
import type { PartyIdentifierResponseDto } from './dto/response/party-identifier-response.dto';
import type { PartyIdentifierTableResponseDto } from './dto/response/party-identifier-table-response.dto';
import type { PartyLicenseResponseDto } from './dto/response/party-license-response.dto';
import type { PartyLicenseTableResponseDto } from './dto/response/party-license-table-response.dto';
import type { PartySocialProfileResponseDto } from './dto/response/party-social-profile-response.dto';
import type { PartySocialProfileTableResponseDto } from './dto/response/party-social-profile-table-response.dto';
import { CompaniesGatewayService } from './services/companies-gateway.service';

@ApiTags('Commerce - Companies')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@RequireFeature(ORG_COMPANIES.featureCode)
@Controller('companies')
export class CompaniesGatewayController {
  private readonly logger = new Logger(CompaniesGatewayController.name);

  constructor(private readonly service: CompaniesGatewayService) {}

  // Returns paginated companies for the data table
  @Get('table')
  @RequirePermission(ORG_COMPANIES.view)
  getTable(@UserId() userId: string): Promise<CompanyTableResponseDto> {
    this.logger.log('GET /commerce-api/companies/table');
    return this.service.findForTable(userId);
  }

  // Returns paginated company options for select dropdowns
  @Get('select')
  @RequirePermission(ORG_COMPANIES.view)
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/companies/select');
    return this.service.select(query);
  }

  // Creates a new company
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.add)
  create(@Body() dto: CreateCompanyDto): Promise<CreateResponseDto<CompanyResponseDto>> {
    this.logger.log('POST /commerce-api/companies');
    return this.service.create(dto);
  }

  // Returns the linked people of a company for the data table
  @Get(':id/people/table')
  @RequirePermission(ORG_COMPANIES.people.view)
  listPeople(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<CompanyPersonTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/people/table`);
    return this.service.listPeople(id, userId);
  }

  // Links a person to a company
  @Post(':id/people')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.people.add)
  addPerson(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddCompanyPersonDto,
  ): Promise<CreateResponseDto<CompanyPersonResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/people`);
    return this.service.addPerson(id, dto);
  }

  // Updates a company-person relationship
  @Patch(':id/people/:relationshipId')
  @RequirePermission(ORG_COMPANIES.people.edit)
  updatePerson(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('relationshipId', new ParseUUIDPipe()) relationshipId: string,
    @Body() dto: UpdateCompanyPersonDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/people/${relationshipId}`);
    return this.service.updatePerson(relationshipId, dto);
  }

  // Removes a company-person relationship
  @Delete(':id/people/:relationshipId')
  @RequirePermission(ORG_COMPANIES.people.delete)
  removePerson(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('relationshipId', new ParseUUIDPipe()) relationshipId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/people/${relationshipId}`);
    return this.service.removePerson(relationshipId);
  }

  // Returns the tax registrations of a company for the data table
  @Get(':id/registrations/table')
  @RequirePermission(ORG_COMPANIES.registrations.view)
  listRegistrations(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<CompanyRegistrationTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/registrations/table`);
    return this.service.listRegistrations(id, userId);
  }

  // Creates a tax registration for a company
  @Post(':id/registrations')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.registrations.add)
  createRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateCompanyRegistrationDto,
  ): Promise<CreateResponseDto<CompanyRegistrationResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/registrations`);
    return this.service.createRegistration(id, dto);
  }

  // Updates a company tax registration
  @Patch(':id/registrations/:regId')
  @RequirePermission(ORG_COMPANIES.registrations.edit)
  updateRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('regId', new ParseUUIDPipe()) regId: string,
    @Body() dto: UpdateCompanyRegistrationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/registrations/${regId}`);
    return this.service.updateRegistration(regId, dto);
  }

  // Deletes a company tax registration
  @Delete(':id/registrations/:regId')
  @RequirePermission(ORG_COMPANIES.registrations.delete)
  deleteRegistration(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('regId', new ParseUUIDPipe()) regId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/registrations/${regId}`);
    return this.service.deleteRegistration(regId);
  }

  // Returns the identifiers of a company for the data table
  @Get(':id/identifiers/table')
  @RequirePermission(ORG_COMPANIES.identifiers.view)
  listIdentifiers(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyIdentifierTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/identifiers/table`);
    return this.service.listIdentifiers(id, userId);
  }

  // Adds an identifier to a company
  @Post(':id/identifiers')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.identifiers.add)
  addIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyIdentifierDto,
  ): Promise<CreateResponseDto<PartyIdentifierResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/identifiers`);
    return this.service.addIdentifier(id, dto);
  }

  // Removes an identifier from a company
  @Delete(':id/identifiers/:identifierId')
  @RequirePermission(ORG_COMPANIES.identifiers.delete)
  removeIdentifier(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('identifierId', new ParseUUIDPipe()) identifierId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/identifiers/${identifierId}`);
    return this.service.removeIdentifier(identifierId);
  }

  // Returns the addresses of a company for the data table
  @Get(':id/addresses/table')
  @RequirePermission(ORG_COMPANIES.addresses.view)
  listAddresses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyAddressTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/addresses/table`);
    return this.service.listAddresses(id, userId);
  }

  // Adds an address to a company
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.addresses.add)
  addAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddPartyAddressDto,
  ): Promise<CreateResponseDto<PartyAddressResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/addresses`);
    return this.service.addAddress(id, dto);
  }

  // Updates an address of a company
  @Patch(':id/addresses/:addressId')
  @RequirePermission(ORG_COMPANIES.addresses.edit)
  updateAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
    @Body() dto: UpdatePartyAddressDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/addresses/${addressId}`);
    return this.service.updateAddress(addressId, dto);
  }

  // Removes an address from a company
  @Delete(':id/addresses/:addressId')
  @RequirePermission(ORG_COMPANIES.addresses.delete)
  removeAddress(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('addressId', new ParseUUIDPipe()) addressId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/addresses/${addressId}`);
    return this.service.removeAddress(addressId);
  }

  // Returns the licenses of a company for the data table
  @Get(':id/licenses/table')
  @RequirePermission(ORG_COMPANIES.licenses.view)
  listLicenses(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyLicenseTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/licenses/table`);
    return this.service.listLicenses(id, userId);
  }

  // Creates a license for a company
  @Post(':id/licenses')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.licenses.add)
  createLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyLicenseDto,
  ): Promise<CreateResponseDto<PartyLicenseResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/licenses`);
    return this.service.createLicense(id, dto);
  }

  // Updates a company license
  @Patch(':id/licenses/:licenseId')
  @RequirePermission(ORG_COMPANIES.licenses.edit)
  updateLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('licenseId', new ParseUUIDPipe()) licenseId: string,
    @Body() dto: UpdatePartyLicenseDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/licenses/${licenseId}`);
    return this.service.updateLicense(licenseId, dto);
  }

  // Deletes a company license
  @Delete(':id/licenses/:licenseId')
  @RequirePermission(ORG_COMPANIES.licenses.delete)
  deleteLicense(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('licenseId', new ParseUUIDPipe()) licenseId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/licenses/${licenseId}`);
    return this.service.deleteLicense(licenseId);
  }

  // Returns the bank accounts of a company for the data table
  @Get(':id/bank-accounts/table')
  @RequirePermission(ORG_COMPANIES.bankAccounts.view)
  listBankAccounts(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyBankAccountTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/bank-accounts/table`);
    return this.service.listBankAccounts(id, userId);
  }

  // Creates a bank account for a company
  @Post(':id/bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.bankAccounts.add)
  createBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyBankAccountDto,
  ): Promise<CreateResponseDto<PartyBankAccountResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/bank-accounts`);
    return this.service.createBankAccount(id, dto);
  }

  // Updates a company bank account
  @Patch(':id/bank-accounts/:accountId')
  @RequirePermission(ORG_COMPANIES.bankAccounts.edit)
  updateBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
    @Body() dto: UpdatePartyBankAccountDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/bank-accounts/${accountId}`);
    return this.service.updateBankAccount(accountId, dto);
  }

  // Deletes a company bank account
  @Delete(':id/bank-accounts/:accountId')
  @RequirePermission(ORG_COMPANIES.bankAccounts.delete)
  deleteBankAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('accountId', new ParseUUIDPipe()) accountId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/bank-accounts/${accountId}`);
    return this.service.deleteBankAccount(accountId);
  }

  // Returns the communications of a company for the data table
  @Get(':id/communications/table')
  @RequirePermission(ORG_COMPANIES.communications.view)
  listCommunications(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartyCommunicationTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/communications/table`);
    return this.service.listCommunications(id, userId);
  }

  // Creates a communication for a company
  @Post(':id/communications')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.communications.add)
  createCommunication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartyCommunicationDto,
  ): Promise<CreateResponseDto<PartyCommunicationResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/communications`);
    return this.service.createCommunication(id, dto);
  }

  // Updates a company communication
  @Patch(':id/communications/:communicationId')
  @RequirePermission(ORG_COMPANIES.communications.edit)
  updateCommunication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('communicationId', new ParseUUIDPipe()) communicationId: string,
    @Body() dto: UpdatePartyCommunicationDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/communications/${communicationId}`);
    return this.service.updateCommunication(communicationId, dto);
  }

  // Deletes a company communication
  @Delete(':id/communications/:communicationId')
  @RequirePermission(ORG_COMPANIES.communications.delete)
  deleteCommunication(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('communicationId', new ParseUUIDPipe()) communicationId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/communications/${communicationId}`);
    return this.service.deleteCommunication(communicationId);
  }

  // Returns the social profiles of a company for the data table
  @Get(':id/social-profiles/table')
  @RequirePermission(ORG_COMPANIES.socialProfiles.view)
  listSocialProfiles(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UserId() userId: string,
  ): Promise<PartySocialProfileTableResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}/social-profiles/table`);
    return this.service.listSocialProfiles(id, userId);
  }

  // Creates a social profile for a company
  @Post(':id/social-profiles')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_COMPANIES.socialProfiles.add)
  createSocialProfile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreatePartySocialProfileDto,
  ): Promise<CreateResponseDto<PartySocialProfileResponseDto>> {
    this.logger.log(`POST /commerce-api/companies/${id}/social-profiles`);
    return this.service.createSocialProfile(id, dto);
  }

  // Updates a company social profile
  @Patch(':id/social-profiles/:profileId')
  @RequirePermission(ORG_COMPANIES.socialProfiles.edit)
  updateSocialProfile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
    @Body() dto: UpdatePartySocialProfileDto,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}/social-profiles/${profileId}`);
    return this.service.updateSocialProfile(profileId, dto);
  }

  // Deletes a company social profile
  @Delete(':id/social-profiles/:profileId')
  @RequirePermission(ORG_COMPANIES.socialProfiles.delete)
  deleteSocialProfile(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('profileId', new ParseUUIDPipe()) profileId: string,
  ): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}/social-profiles/${profileId}`);
    return this.service.deleteSocialProfile(profileId);
  }

  // Returns a company by ID
  @Get(':id')
  @RequirePermission(ORG_COMPANIES.view)
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<CompanyResponseDto> {
    this.logger.log(`GET /commerce-api/companies/${id}`);
    return this.service.findById(id);
  }

  // Updates a company by ID
  @Patch(':id')
  @RequirePermission(ORG_COMPANIES.edit)
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateCompanyDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/companies/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a company by ID
  @Delete(':id')
  @RequirePermission(ORG_COMPANIES.delete)
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/companies/${id}`);
    return this.service.delete(id);
  }
}
