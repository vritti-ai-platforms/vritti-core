import { TaxClassTableResponseDto } from '@commerce/tax-classes/dto/response/tax-class-table-response.dto';
import { CreateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/create-tax-class-group-on-class.dto';
import { UpdateTaxClassGroupOnClassDto } from '@commerce/tax-groups/dto/request/update-tax-class-group-on-class.dto';
import { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiFindForTableTaxClasses() {
  return applyDecorators(
    ApiOperation({
      summary: 'Tax classes table',
      description:
        'Every tax class of the organization, active and inactive, each with the tax groups it is mapped to in the saved table context — `filters.context` fields `country` (ISO 3166-1 alpha-2) and `asOf` (YYYY-MM-DD). Several groups when the class has price slabs, ordered by price limit with no limit last; without both context values every class is listed with no groups.',
    }),
    ApiResponse({ status: 200, type: TaxClassTableResponseDto }),
  );
}

const TAX_CLASS_ID = { name: 'taxClassId', description: 'Tax class ID' };
const MAPPING_ID = { name: 'mappingId', description: 'Tax class mapping ID' };

export function ApiFindForTableTaxClassGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'Tax groups a tax class is mapped to',
      description:
        'Every dated mapping of the class in one country, latest period first. The country comes from the saved table state (`filters.context`, field `country`); without one the table is empty.',
    }),
    ApiParam(TAX_CLASS_ID),
    ApiResponse({ status: 200, type: TaxClassGroupTableResponseDto }),
    ApiResponse({ status: 404, description: 'Tax class not found.' }),
  );
}

export function ApiCreateTaxClassGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Map a tax class to a tax group',
      description:
        'The mapping takes the group’s country. Mappings of one class and price limit (none = any price) in a country may not overlap in time; a new mapping that starts after an open-ended one ends it the day before.',
    }),
    ApiParam(TAX_CLASS_ID),
    ApiBody({ type: CreateTaxClassGroupOnClassDto }),
    ApiResponse({ status: 201, description: 'Class mapped.' }),
    ApiResponse({
      status: 400,
      description: 'An unknown tax class, a non-positive price limit, or an inverted period.',
    }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another mapping of the class.' }),
  );
}

export function ApiUpdateTaxClassGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a group mapping of a tax class',
      description:
        'Neither the class nor the group can change. The resulting price limit and period are checked together.',
    }),
    ApiParam(TAX_CLASS_ID),
    ApiParam(MAPPING_ID),
    ApiBody({ type: UpdateTaxClassGroupOnClassDto }),
    ApiResponse({ status: 200, description: 'Mapping updated.' }),
    ApiResponse({ status: 400, description: 'A non-positive price limit, or an inverted period.' }),
    ApiResponse({ status: 404, description: 'Mapping not found on the tax class.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another mapping of the class.' }),
  );
}

export function ApiDeleteTaxClassGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a group mapping of a tax class' }),
    ApiParam(TAX_CLASS_ID),
    ApiParam(MAPPING_ID),
    ApiResponse({ status: 200, description: 'Mapping removed.' }),
    ApiResponse({ status: 404, description: 'Mapping not found on the tax class.' }),
  );
}
