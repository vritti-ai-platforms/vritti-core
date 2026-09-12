import { TaxRegistrationResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-response.dto';
import { TaxRegistrationTableResponseDto } from '@commerce/tax-registrations/dto/response/tax-registration-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Tax registration ID' };

export function ApiFindForTableTaxRegistrations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Tax registrations table',
      description: 'Every tax registration held by legal entities in reach, with the jurisdiction each is issued in.',
    }),
    ApiResponse({ status: 200, type: TaxRegistrationTableResponseDto }),
  );
}

export function ApiListTaxRegistrations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Registrations of one legal entity',
      description: 'The origin registrations tax resolution reads from when this entity is the supplier.',
    }),
    ApiResponse({ status: 200, type: [TaxRegistrationResponseDto] }),
  );
}

export function ApiGetTaxRegistration() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a tax registration' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: TaxRegistrationResponseDto }),
    ApiResponse({ status: 404, description: 'Tax registration not found.' }),
  );
}

export function ApiCreateTaxRegistration() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a tax registration',
      description: 'The number is unique per organization. Marking it primary clears the flag on the others.',
    }),
    ApiResponse({ status: 201, description: 'Registration added.' }),
    ApiResponse({ status: 409, description: 'That number is already registered.' }),
  );
}

export function ApiUpdateTaxRegistration() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a tax registration' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Registration updated.' }),
    ApiResponse({ status: 409, description: 'That number is already registered.' }),
  );
}

export function ApiDeleteTaxRegistration() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a tax registration' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Registration removed.' }),
  );
}
