import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { OfferingDimensionResponseDto } from '../dto/response/offering-dimension-response.dto';
import { OfferingResponseDto } from '../dto/response/offering-response.dto';
import { OfferingTableResponseDto } from '../dto/response/offering-table-response.dto';
import { OfferingVariantResponseDto } from '../dto/response/offering-variant-response.dto';
import { OfferingVariantTableResponseDto } from '../dto/response/offering-variant-table-response.dto';
import { VariantCombinationsResponseDto } from '../dto/response/variant-combinations-response.dto';

const NOT_OWNED = { status: 403, description: 'Owned by a wider scope — switch workspace to change it.' };
const UNAUTHORIZED = { status: 401, description: 'Unauthorized.' };
const NOT_FOUND = { status: 404, description: 'Not found or out of reach.' };
const ID = { name: 'id', description: 'Identifier' };

export function ApiOfferingsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Offerings data table',
      description: "One page of reachable offerings, merged with the caller's saved table view state.",
    }),
    ApiResponse({ status: 200, type: OfferingTableResponseDto, description: 'Offerings page retrieved.' }),
    ApiResponse(UNAUTHORIZED),
  );
}

export function ApiGetOffering() {
  return applyDecorators(
    ApiOperation({ summary: 'Get an offering', description: 'One offering with its dimension and variant counts.' }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: OfferingResponseDto, description: 'Offering retrieved.' }),
    ApiResponse(NOT_FOUND),
    ApiResponse(UNAUTHORIZED),
  );
}

export function ApiCreateOffering() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an offering',
      description:
        'Creates an offering owned by the calling workspace. It stays inactive until it has at least one variant.',
    }),
    ApiResponse({ status: 201, type: OfferingResponseDto, description: 'Offering created.' }),
    ApiResponse({ status: 409, description: 'Code or name already used.' }),
    ApiResponse(UNAUTHORIZED),
  );
}

export function ApiUpdateOffering() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an offering',
      description:
        'Fulfilment type is create-only — it drives the rules existing variants were built against. The code may change, but stored SKUs are never recomputed, so it only shapes variants created afterwards.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Offering updated.' }),
    ApiResponse(NOT_OWNED),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiSetOfferingStatus() {
  return applyDecorators(
    ApiOperation({ summary: 'Activate or deactivate an offering', description: 'Refused while it has no variants.' }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Offering activation changed.' }),
    ApiResponse({ status: 409, description: 'No variants yet.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiBulkSetOfferingStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mark many offerings active or draft',
      description: 'All or nothing — refused unless every selected offering may make the move.',
    }),
    ApiResponse({ status: 200, description: 'Offering activation changed.' }),
    ApiResponse({ status: 409, description: 'Some of them have no variants yet.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiDeleteOffering() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an offering',
      description: 'Refused while it still has variants — a variant may carry stock or order history.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Offering deleted.' }),
    ApiResponse({ status: 409, description: 'Still has variants.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiListOfferingDimensions() {
  return applyDecorators(
    ApiOperation({
      summary: 'List an offering’s dimensions',
      description: 'Dimensions with their values, in the order their codes appear in a derived SKU.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: [OfferingDimensionResponseDto], description: 'Dimensions retrieved.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiCreateOfferingDimension() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a custom dimension',
      description:
        'Appends an empty dimension defined inline. Existing variants are unaffected — a variant carries whichever dimensions apply to it. Its values are set through the values endpoint.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 201, type: OfferingDimensionResponseDto, description: 'Dimension added.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiCreateOfferingDimensionFromTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a dimension from a template',
      description:
        'Appends a dimension seeded from a template — its code, name and values are copied server-side, so the request carries only the template reference. The copy keeps no link back, so editing the template later never reshapes the offering.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 201, type: OfferingDimensionResponseDto, description: 'Dimension added from template.' }),
    ApiResponse({ status: 400, description: 'Template has no values.' }),
    ApiResponse(NOT_FOUND),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiUpsertOfferingDimensionValues() {
  return applyDecorators(
    ApiOperation({
      summary: "Set a dimension's values",
      description:
        'Replaces the value set. Values already carried by a variant cannot be dropped — the variant holds a foreign key to them and their codes are part of its stored SKU.',
    }),
    ApiParam({ name: 'dimensionId', description: 'Dimension identifier' }),
    ApiResponse({ status: 200, description: 'Values saved.' }),
    ApiResponse({ status: 400, description: 'Duplicate value code.' }),
    ApiResponse({ status: 409, description: 'A value in use by existing variants was removed.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiReorderOfferingDimensions() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reorder dimensions',
      description:
        'Sets the axis order, which is the order their codes appear in a derived SKU. Refused once the offering has variants — their SKUs are built from the current order, so changing it would rewrite identifiers already in use.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Order updated.' }),
    ApiResponse({ status: 400, description: "The list does not match the offering's dimensions." }),
    ApiResponse({ status: 409, description: 'Variants exist, so the order is locked.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiDeleteOfferingDimension() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a dimension',
      description: 'Refused while any variant holds one of its values.',
    }),
    ApiParam({ name: 'dimensionId', description: 'Dimension identifier' }),
    ApiResponse({ status: 200, description: 'Dimension removed.' }),
    ApiResponse({ status: 409, description: 'In use by variants.' }),
  );
}

export function ApiOfferingVariantsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Offering variants data table',
      description: "One page of an offering's variants, merged with the caller's saved table view state.",
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, type: OfferingVariantTableResponseDto, description: 'Variants page retrieved.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiPreviewOfferingVariantCombinations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Preview variant combinations',
      description:
        'Returns every combination the selected values produce, each with the SKU and name it would be created under, and a flag for the ones a variant already carries. Read-only — nothing is created.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Combinations resolved.', type: VariantCombinationsResponseDto }),
    ApiResponse({ status: 400, description: 'A selected value does not belong to this offering.' }),
  );
}

export function ApiGenerateOfferingVariants() {
  return applyDecorators(
    ApiOperation({
      summary: 'Generate variants',
      description:
        'Creates every selected combination that does not already exist. Additive — a combination left out is never deleted. Each variant’s SKU is derived from the offering code plus one value code per dimension, so it is unique by construction.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Variants generated.' }),
    ApiResponse({ status: 400, description: 'Incomplete combination.' }),
    ApiResponse({ status: 409, description: 'The offering has no dimensions.' }),
  );
}

export function ApiCreateOfferingVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Add a single variant', description: 'One explicit combination.' }),
    ApiParam(ID),
    ApiResponse({ status: 201, type: OfferingVariantResponseDto, description: 'Variant created.' }),
    ApiResponse({ status: 409, description: 'That combination already exists.' }),
  );
}

export function ApiGetOfferingVariant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a variant',
      description: 'One variant with its dimension values and bill of materials.',
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, type: OfferingVariantResponseDto, description: 'Variant retrieved.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiUpdateOfferingVariant() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a variant',
      description: 'Activation is refused until the bill of materials satisfies the offering’s fulfilment type.',
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Variant updated.' }),
    ApiResponse({ status: 409, description: 'Bill of materials does not allow activation.' }),
  );
}

export function ApiBulkSetVariantsStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Mark many variants active or draft',
      description: 'All or nothing — refused unless every selected variant satisfies the offering’s BOM rule.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Variant activation changed.' }),
    ApiResponse({ status: 409, description: 'Some of them have no bill of materials.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiDeleteOfferingVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a variant' }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Variant deleted.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiCreateVariantInventoryItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create the inventory item a variant resolves to',
      description:
        "Creates an inventory item carrying this variant's SKU and links it as the variant's single bill-of-materials line. STOCK offerings only — every other fulfilment type resolves to components that are stocked in their own right, so there is nothing to create.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 201, type: OfferingVariantResponseDto, description: 'Item created and linked.' }),
    ApiResponse({ status: 409, description: 'An item already carries this SKU, or the offering is not STOCK.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiAddSuggestedComponent() {
  return applyDecorators(
    ApiOperation({
      summary: "Link the item carrying this variant's SKU",
      description:
        "Adds the inventory item whose SKU equals this variant's, at quantity 1 in that item's own stocking unit. The item is resolved server-side from the SKU, so the request names none — this cannot be used to link an arbitrary item under a narrower grant than editing the bill of materials.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Component linked.' }),
    ApiResponse({ status: 409, description: 'No item carries this SKU, or it is already a component.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiAddBomLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add one component',
      description:
        "Adds a single line to a variant's bill of materials. The fulfilment type's maximum is checked against what is already stored, so concurrent adds cannot both slip past it.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 201, description: 'Component added.' }),
    ApiResponse({ status: 409, description: 'Already at the maximum, or that item and unit are already a component.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiUpdateBomLine() {
  return applyDecorators(
    ApiOperation({ summary: 'Re-quantify a component', description: "Changes one line's quantity or unit." }),
    ApiParam({ name: 'lineId', description: 'Bill-of-materials line identifier' }),
    ApiResponse({ status: 200, description: 'Component updated.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiDeleteBomLine() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a component',
      description:
        "Removes one line. If that drops the variant below its fulfilment type's minimum it is deactivated rather than left sellable with nothing to sell.",
    }),
    ApiParam({ name: 'lineId', description: 'Bill-of-materials line identifier' }),
    ApiResponse({ status: 200, description: 'Component removed.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiSetOfferingTaxClass() {
  return applyDecorators(
    ApiOperation({
      summary: "Set an offering's tax class",
      description:
        'Applies the tax class to the offering and cascades it to every variant that has not pinned its own. The response reports how many were updated and how many kept an override.',
    }),
    ApiParam(ID),
    ApiResponse({ status: 200, description: 'Tax class applied.' }),
    ApiResponse(NOT_OWNED),
  );
}

export function ApiSetVariantTaxClass() {
  return applyDecorators(
    ApiOperation({
      summary: "Pin a variant's own tax class",
      description: "Overrides the offering's tax class for this variant, exempting it from future cascades.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Tax class overridden.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiClearVariantTaxClass() {
  return applyDecorators(
    ApiOperation({
      summary: "Drop a variant's tax class override",
      description: "Resynchronises the variant with its offering's tax class and re-enrols it in future cascades.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Override cleared.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiSetOfferingFulfilment() {
  return applyDecorators(
    ApiOperation({
      summary: "Change an offering's fulfilment type",
      description:
        'Cascades to every variant that has not pinned its own. Refused when any of those variants holds a bill of materials the new type forbids, so the offering never half-changes.',
    }),
    ApiParam({ name: 'id', description: 'Offering identifier' }),
    ApiResponse({ status: 200, description: 'Fulfilment type updated.' }),
    ApiResponse({ status: 409, description: 'Variants hold components the new type forbids.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiSetVariantFulfilment() {
  return applyDecorators(
    ApiOperation({
      summary: "Pin a variant's own fulfilment type",
      description:
        "Overrides the offering's type for this variant — a variety pack inside a stock offering is composite. Exempts it from future cascades.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Fulfilment type overridden.' }),
    ApiResponse({ status: 409, description: 'Its components do not fit the new type.' }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiClearVariantFulfilment() {
  return applyDecorators(
    ApiOperation({
      summary: "Drop a variant's fulfilment override",
      description: "Resynchronises the variant with its offering's type and re-enrols it in future cascades.",
    }),
    ApiParam({ name: 'variantId', description: 'Variant identifier' }),
    ApiResponse({ status: 200, description: 'Override cleared.' }),
    ApiResponse({ status: 409, description: "Its components do not fit the offering's type." }),
    ApiResponse(NOT_FOUND),
  );
}

export function ApiUpdateOfferingDimension() {
  return applyDecorators(
    ApiOperation({
      summary: 'Rename a dimension',
      description:
        'Changes the label only. The code is fixed once the dimension exists, because it is a segment of every SKU derived from it.',
    }),
    ApiParam({ name: 'dimensionId', description: 'Dimension identifier' }),
    ApiResponse({ status: 200, description: 'Dimension renamed.' }),
    ApiResponse(NOT_OWNED),
  );
}
