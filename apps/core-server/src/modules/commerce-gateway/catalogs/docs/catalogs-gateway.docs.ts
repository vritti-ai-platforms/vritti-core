import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { AssignCatalogChannelDto } from '../dto/request/assign-catalog-channel.dto';
import { CreateCatalogDto } from '../dto/request/create-catalog.dto';
import { CreateModifierGroupDto } from '../dto/request/create-modifier-group.dto';
import { CreateModifierOptionDto } from '../dto/request/create-modifier-option.dto';
import { CreateOfferingDto } from '../dto/request/create-offering.dto';
import { CreateVariantDto } from '../dto/request/create-variant.dto';
import { CreateVariantOptionDto } from '../dto/request/create-variant-option.dto';
import { SaveOfferingModifiersDto } from '../dto/request/save-offering-modifiers.dto';
import { UpdateCatalogDto } from '../dto/request/update-catalog.dto';
import { UpdateModifierGroupDto } from '../dto/request/update-modifier-group.dto';
import { UpdateModifierOptionDto } from '../dto/request/update-modifier-option.dto';
import { UpdateOfferingDto } from '../dto/request/update-offering.dto';
import { UpdateVariantDto } from '../dto/request/update-variant.dto';
import { UpdateVariantOptionDto } from '../dto/request/update-variant-option.dto';
import { CatalogChannelResponseDto } from '../dto/response/catalog-channel-response.dto';
import { CatalogResponseDto } from '../dto/response/catalog-response.dto';
import { CatalogTableResponseDto } from '../dto/response/catalog-table-response.dto';
import { ModifierGroupResponseDto, ModifierOptionResponseDto } from '../dto/response/modifier-group-response.dto';
import { OfferingDetailResponseDto, OfferingVariantResponseDto } from '../dto/response/offering-detail-response.dto';
import { OfferingModifierGroupResponseDto } from '../dto/response/offering-modifier-group-response.dto';
import { OfferingsTableResponseDto } from '../dto/response/offerings-table-response.dto';
import { VariantOptionResponseDto } from '../dto/response/variant-option-response.dto';

export function ApiGetCatalogsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get catalogs table',
      description: 'Returns paginated, filtered, and sorted catalogs using server-stored table state.',
    }),
    ApiResponse({ status: 200, description: 'Catalogs table retrieved successfully.', type: CatalogTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a catalog' }),
    ApiBody({ type: CreateCatalogDto }),
    ApiResponse({ status: 201, description: 'Catalog created successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a catalog by ID' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({ status: 200, description: 'Catalog retrieved successfully.', type: CatalogResponseDto }),
    ApiResponse({ status: 404, description: 'Catalog not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiBody({ type: UpdateCatalogDto }),
    ApiResponse({ status: 200, description: 'Catalog updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Catalog not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalog() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({ status: 200, description: 'Catalog deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Catalog not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCloneCatalog() {
  return applyDecorators(
    ApiOperation({
      summary: 'Clone a catalog',
      description:
        'Clones a catalog and its offerings, variants, options, and modifier groups into a new catalog with no channel assignments.',
    }),
    ApiParam({ name: 'id', description: 'Source catalog ID' }),
    ApiResponse({ status: 201, description: 'Catalog cloned successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 404, description: 'Catalog not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListCatalogChannels() {
  return applyDecorators(
    ApiOperation({ summary: 'List channel assignments for a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({
      status: 200,
      description: 'Channel assignments retrieved successfully.',
      type: CatalogChannelResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiAssignCatalogChannel() {
  return applyDecorators(
    ApiOperation({
      summary: 'Assign a channel to a catalog',
      description: 'Maps a (business unit, channel) pair to the catalog. Each pair maps to exactly one catalog.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiBody({ type: AssignCatalogChannelDto }),
    ApiResponse({ status: 201, description: 'Channel assigned successfully.', type: CatalogChannelResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'Catalog not found.' }),
    ApiResponse({ status: 409, description: 'This business unit + channel is already mapped to a catalog.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUnassignCatalogChannel() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a channel assignment from a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'assignmentId', description: 'Catalog-channel assignment ID' }),
    ApiResponse({ status: 200, description: 'Channel assignment removed successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Assignment not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCatalogOfferingsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get offerings table for a catalog',
      description: 'Returns paginated, filtered, and sorted offerings for the catalog using server-stored table state.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({
      status: 200,
      description: 'Offerings table retrieved successfully.',
      type: OfferingsTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalogOffering() {
  return applyDecorators(
    ApiOperation({ summary: 'Create an offering under a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiBody({ type: CreateOfferingDto }),
    ApiResponse({ status: 201, description: 'Offering created successfully.', type: CreateResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCatalogOffering() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get an offering by ID',
      description: 'Returns offering with full details including options and variants.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiResponse({ status: 200, description: 'Offering retrieved successfully.', type: OfferingDetailResponseDto }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalogOffering() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an offering' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiBody({ type: UpdateOfferingDto }),
    ApiResponse({ status: 200, description: 'Offering updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalogOffering() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an offering' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiResponse({ status: 200, description: 'Offering deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListCatalogVariantOptions() {
  return applyDecorators(
    ApiOperation({ summary: 'List variant options for a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({
      status: 200,
      description: 'Variant options retrieved successfully.',
      type: VariantOptionResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalogVariantOption() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a variant option',
      description: 'Adds a reusable variant option and its values to a catalog.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiBody({ type: CreateVariantOptionDto }),
    ApiResponse({ status: 201, description: 'Variant option created successfully.', type: VariantOptionResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalogVariantOption() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a variant option',
      description:
        'Renames a variant option and/or reconciles its values. Values still used by variants cannot be removed.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'optionId', description: 'Variant option ID' }),
    ApiBody({ type: UpdateVariantOptionDto }),
    ApiResponse({ status: 200, description: 'Variant option updated successfully.', type: VariantOptionResponseDto }),
    ApiResponse({ status: 404, description: 'Variant option not found.' }),
    ApiResponse({ status: 409, description: 'A removed value is still in use.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalogVariantOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a variant option' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'optionId', description: 'Variant option ID' }),
    ApiResponse({ status: 200, description: 'Variant option deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Variant option not found.' }),
    ApiResponse({ status: 409, description: 'The variant option is still in use.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalogOfferingVariant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an offering variant',
      description: 'Creates a single variant from an explicit option-value combination.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiBody({ type: CreateVariantDto }),
    ApiResponse({ status: 201, description: 'Variant created successfully.', type: OfferingVariantResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 409, description: 'A variant with this combination already exists.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListCatalogOfferingVariants() {
  return applyDecorators(
    ApiOperation({ summary: 'List offering variants' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiResponse({
      status: 200,
      description: 'Variants retrieved successfully.',
      type: OfferingVariantResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalogOfferingVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an offering variant' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiParam({ name: 'variantId', description: 'Variant ID' }),
    ApiBody({ type: UpdateVariantDto }),
    ApiResponse({ status: 200, description: 'Variant updated successfully.', type: OfferingVariantResponseDto }),
    ApiResponse({ status: 404, description: 'Variant not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalogOfferingVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an offering variant' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiParam({ name: 'variantId', description: 'Variant ID' }),
    ApiResponse({ status: 200, description: 'Variant deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Variant not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListCatalogOfferingModifiers() {
  return applyDecorators(
    ApiOperation({ summary: 'List modifier groups assigned to an offering' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiResponse({
      status: 200,
      description: 'Modifier groups retrieved successfully.',
      type: OfferingModifierGroupResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSaveCatalogOfferingModifiers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Save modifier group assignments for an offering',
      description: 'Replaces all modifier group assignments for the offering.',
    }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'offeringId', description: 'Offering ID' }),
    ApiBody({ type: SaveOfferingModifiersDto }),
    ApiResponse({
      status: 200,
      description: 'Modifier assignments saved successfully.',
      type: OfferingModifierGroupResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'Offering not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListCatalogModifierGroups() {
  return applyDecorators(
    ApiOperation({ summary: 'List modifier groups for a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiResponse({
      status: 200,
      description: 'Modifier groups retrieved successfully.',
      type: ModifierGroupResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalogModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a modifier group under a catalog' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiBody({ type: CreateModifierGroupDto }),
    ApiResponse({ status: 201, description: 'Modifier group created successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCatalogModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a modifier group with options' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiResponse({ status: 200, description: 'Modifier group retrieved successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalogModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a modifier group' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiBody({ type: UpdateModifierGroupDto }),
    ApiResponse({ status: 200, description: 'Modifier group updated successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalogModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a modifier group' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiResponse({ status: 200, description: 'Modifier group deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCatalogModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a modifier option', description: 'Adds a new option to a modifier group.' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiBody({ type: CreateModifierOptionDto }),
    ApiResponse({ status: 201, description: 'Modifier option created successfully.', type: ModifierOptionResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCatalogModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a modifier option' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiParam({ name: 'optionId', description: 'Modifier option ID' }),
    ApiBody({ type: UpdateModifierOptionDto }),
    ApiResponse({ status: 200, description: 'Modifier option updated successfully.', type: ModifierOptionResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier option not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCatalogModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a modifier option' }),
    ApiParam({ name: 'id', description: 'Catalog ID' }),
    ApiParam({ name: 'groupId', description: 'Modifier group ID' }),
    ApiParam({ name: 'optionId', description: 'Modifier option ID' }),
    ApiResponse({ status: 200, description: 'Modifier option deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier option not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
