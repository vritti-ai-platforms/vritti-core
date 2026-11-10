import { CreateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/create-tax-class-group.dto';
import { CreateTaxGroupDto } from '@commerce/tax-groups/dto/request/create-tax-group.dto';
import { CreateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/create-tax-group-rate.dto';
import { SetTaxGroupActiveDto } from '@commerce/tax-groups/dto/request/set-tax-group-active.dto';
import { UpdateTaxClassGroupDto } from '@commerce/tax-groups/dto/request/update-tax-class-group.dto';
import { UpdateTaxGroupDto } from '@commerce/tax-groups/dto/request/update-tax-group.dto';
import { UpdateTaxGroupRateDto } from '@commerce/tax-groups/dto/request/update-tax-group-rate.dto';
import { TaxClassGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-class-group-table-response.dto';
import { TaxGroupRateTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-rate-table-response.dto';
import { TaxGroupResponseDto } from '@commerce/tax-groups/dto/response/tax-group-response.dto';
import { TaxGroupTableResponseDto } from '@commerce/tax-groups/dto/response/tax-group-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

const ID = { name: 'id', description: 'Tax group ID' };
const RATE_ID = { name: 'rateId', description: 'Tax rate ID' };
const MAPPING_ID = { name: 'mappingId', description: 'Tax class mapping ID' };

export function ApiFindForTableTaxGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'Tax groups table',
      description:
        'The organization’s tax groups with their rate and class counts. The country comes from the saved table state (`filters.context`, field `country`); without one every country’s groups are listed.',
    }),
    ApiResponse({ status: 200, type: TaxGroupTableResponseDto }),
  );
}

export function ApiGetTaxGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a tax group' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: TaxGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
  );
}

export function ApiCreateTaxGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a tax group',
      description: 'A group belongs to one country, fixed once created; its code is unique within that country.',
    }),
    ApiBody({ type: CreateTaxGroupDto }),
    ApiResponse({ status: 201, description: 'Tax group created.' }),
    ApiResponse({ status: 409, description: 'The country already has a group with this code.' }),
  );
}

export function ApiUpdateTaxGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a tax group', description: 'The country cannot change.' }),
    ApiParam(ID),
    ApiBody({ type: UpdateTaxGroupDto }),
    ApiResponse({ status: 200, description: 'Tax group updated.' }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'The country already has a group with this code.' }),
  );
}

export function ApiSetTaxGroupActive() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activate or deactivate a tax group',
      description: 'Deactivating is refused while a class mapping in force or still to come names the group.',
    }),
    ApiParam(ID),
    ApiBody({ type: SetTaxGroupActiveDto }),
    ApiResponse({ status: 200, description: 'Tax group activated or deactivated.' }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'Tax classes are mapped to the group today or from a later day.' }),
  );
}

export function ApiDeleteTaxGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a tax group',
      description: 'Deletes its rates too. Refused while tax classes are mapped to it.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Tax group deleted.' }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'Tax classes are mapped to the group.' }),
  );
}

export function ApiFindForTableTaxGroupRates() {
  return applyDecorators(
    ApiOperation({
      summary: 'Rates of a tax group',
      description:
        'Dated rates per component, jurisdiction and jurisdiction check, in the order the group applies them. Pass `jurisdiction` to list only the rates charged in that state (its own rates, and the whole-country rates of every component it has none for — per component the more specific jurisdiction wins), and `asOf` to list only the rates in force on that day.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: TaxGroupRateTableResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
  );
}

export function ApiCreateTaxGroupRate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a rate to a tax group',
      description:
        'The component and jurisdiction must be of the group’s country. A PERCENT rate takes `rate`; an AMOUNT_PER_MEASURE rate takes `amount` and `measure`. `jurisdictionCheck` SAME / DIFFERENT limits the rate to supplies within or across jurisdictions (e.g. CGST vs IGST); omit it for a rate that always applies. Rates of one component, jurisdiction (none = the whole country) and jurisdiction check may not overlap in time; a new rate that starts after an open-ended one ends it the day before.',
    }),
    ApiParam(ID),
    ApiBody({ type: CreateTaxGroupRateDto }),
    ApiResponse({ status: 201, description: 'Rate added.' }),
    ApiResponse({
      status: 400,
      description:
        'A component or jurisdiction outside the group’s country, or values that do not fit the calculation.',
    }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another rate.' }),
  );
}

export function ApiUpdateTaxGroupRate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a rate of a tax group',
      description:
        'The resulting component, jurisdiction, calculation and period are checked together. Switching calculation drops the values of the previous kind.',
    }),
    ApiParam(ID),
    ApiParam(RATE_ID),
    ApiBody({ type: UpdateTaxGroupRateDto }),
    ApiResponse({ status: 200, description: 'Rate updated.' }),
    ApiResponse({
      status: 400,
      description:
        'A component or jurisdiction outside the group’s country, or values that do not fit the calculation.',
    }),
    ApiResponse({ status: 404, description: 'Tax group or rate not found.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another rate.' }),
  );
}

export function ApiDeleteTaxGroupRate() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a rate from a tax group' }),
    ApiParam(ID),
    ApiParam(RATE_ID),
    ApiResponse({ status: 200, description: 'Rate removed.' }),
    ApiResponse({ status: 404, description: 'Tax group or rate not found.' }),
  );
}

export function ApiFindForTableTaxGroupClasses() {
  return applyDecorators(
    ApiOperation({ summary: 'Tax classes mapped to a tax group', description: 'Every dated mapping to the group.' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: TaxClassGroupTableResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
  );
}

export function ApiCreateTaxGroupClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Map a tax class to a tax group',
      description:
        'The mapping takes the group’s country. Mappings of one class and price limit (none = any price) in a country may not overlap in time.',
    }),
    ApiParam(ID),
    ApiBody({ type: CreateTaxClassGroupDto }),
    ApiResponse({ status: 201, description: 'Class mapped.' }),
    ApiResponse({
      status: 400,
      description: 'An unknown tax class, a non-positive price limit, or an inverted period.',
    }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another mapping of the class.' }),
  );
}

export function ApiUpdateTaxGroupClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a class mapping of a tax group',
      description: 'The resulting class, price limit and period are checked together.',
    }),
    ApiParam(ID),
    ApiParam(MAPPING_ID),
    ApiBody({ type: UpdateTaxClassGroupDto }),
    ApiResponse({ status: 200, description: 'Mapping updated.' }),
    ApiResponse({
      status: 400,
      description: 'An unknown tax class, a non-positive price limit, or an inverted period.',
    }),
    ApiResponse({ status: 404, description: 'Tax group or mapping not found.' }),
    ApiResponse({ status: 409, description: 'The period overlaps another mapping of the class.' }),
  );
}

export function ApiDeleteTaxGroupClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove a class mapping from a tax group' }),
    ApiParam(ID),
    ApiParam(MAPPING_ID),
    ApiResponse({ status: 200, description: 'Mapping removed.' }),
    ApiResponse({ status: 404, description: 'Tax group or mapping not found.' }),
  );
}
