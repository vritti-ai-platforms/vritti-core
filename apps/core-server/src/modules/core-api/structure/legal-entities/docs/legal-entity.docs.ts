import { LeTaxRegistrationDto } from '@domain/legal-entity/dto/entity/le-tax-registration.dto';
import { LegalEntityDto } from '@domain/legal-entity/dto/entity/legal-entity.dto';
import { CreateLeTaxRegistrationInternalDto } from '@domain/legal-entity/dto/request/create-le-tax-registration-internal.dto';
import { CreateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/create-legal-entity-internal.dto';
import { UpdateLegalEntityInternalDto } from '@domain/legal-entity/dto/request/update-legal-entity-internal.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';

export function ApiCreateLegalEntity() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create legal entity',
      description:
        'Creates a new legal entity for an organization. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateLegalEntityInternalDto }),
    ApiResponse({ status: 201, description: 'Legal entity created successfully.', type: LegalEntityDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or parent legal entity.' }),
    ApiResponse({ status: 409, description: 'Legal entity code already exists in the organization.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiUpdateLegalEntity() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update legal entity',
      description:
        'Updates a legal entity name, code, country, currency, tax regime, fiscal year start, parent, or active status.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiBody({ type: UpdateLegalEntityInternalDto }),
    ApiResponse({ status: 200, description: 'Legal entity updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or parent legal entity.' }),
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
    ApiResponse({ status: 409, description: 'Legal entity code already exists in the organization.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiAddLeTaxRegistration() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add tax registration',
      description:
        'Adds a tax registration (GSTIN, TRN, VAT number) to a legal entity. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiBody({ type: CreateLeTaxRegistrationInternalDto }),
    ApiResponse({ status: 201, description: 'Tax registration added successfully.', type: LeTaxRegistrationDto }),
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
    ApiResponse({ status: 409, description: 'Tax number already registered on the legal entity.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteLegalEntity() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete legal entity',
      description: 'Deletes a legal entity. Fails if any sites are linked to it or if it has child legal entities.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiResponse({ status: 200, description: 'Legal entity deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
    ApiResponse({ status: 409, description: 'Legal entity is linked to sites or has child legal entities.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteLeTaxRegistration() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete tax registration',
      description: 'Deletes a tax registration from a legal entity. Fails if any sites are linked to it.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiParam({ name: 'regId', description: 'Tax registration ID' }),
    ApiResponse({ status: 200, description: 'Tax registration deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Legal entity or tax registration not found.' }),
    ApiResponse({ status: 409, description: 'Tax registration is linked to sites.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetLegalEntityLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get legal entity feature locks',
      description:
        'Returns the stored legal entity feature lock deny-list (null = inherit the full plan). Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiResponse({ status: 200, description: 'Feature locks returned successfully.', type: FeatureLocksResponseDto }),
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiSetLegalEntityLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace legal entity feature locks',
      description:
        'Replaces the legal entity feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiBody({ type: SetFeatureLocksInternalDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Legal entity not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListLegalEntityRoleAssignments() {
  return applyDecorators(
    ApiOperation({
      summary: 'List legal entity role assignments',
      description: 'Returns all role assignments directly targeting a legal entity with user and role names.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Legal entity ID' }),
    ApiResponse({ status: 200, description: 'Role assignments retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}
