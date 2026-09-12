import { CreateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/create-offering-dimension-template.dto';
import { SetOfferingDimensionTemplateActiveDto } from '@commerce/offering-dimension-templates/dto/request/set-offering-dimension-template-active.dto';
import { UpdateOfferingDimensionTemplateDto } from '@commerce/offering-dimension-templates/dto/request/update-offering-dimension-template.dto';
import { UpsertOfferingDimensionTemplateValuesDto } from '@commerce/offering-dimension-templates/dto/request/upsert-offering-dimension-template-values.dto';
import { OfferingDimensionTemplateResponseDto } from '@commerce/offering-dimension-templates/dto/response/offering-dimension-template-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';

// Shared by the org, le and site controllers — the three surfaces are identical, and the workspace
// header decides which templates are reachable, so one set of docs describes all of them.
export function ApiListOfferingDimensionTemplates() {
  return applyDecorators(
    ApiOperation({
      summary: 'List dimension templates',
      description:
        'Returns every template this workspace can reach — org-owned ones plus its own — each with its values.',
    }),
    ApiQuery({ name: 'search', required: false, description: 'Filter by name or description' }),
    ApiResponse({
      status: 200,
      description: 'Dimension templates retrieved successfully.',
      type: [OfferingDimensionTemplateResponseDto],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateOfferingDimensionTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a dimension template',
      description:
        'Creates a template owned by the calling workspace. The owner is derived from the workspace context, never from the request body.',
    }),
    ApiBody({ type: CreateOfferingDimensionTemplateDto }),
    ApiResponse({
      status: 201,
      description: 'Dimension template created successfully.',
      type: OfferingDimensionTemplateResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 409, description: 'A template with this name already exists in this workspace.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetOfferingDimensionTemplate() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a dimension template by ID, with its values' }),
    ApiParam({ name: 'id', description: 'Dimension template ID' }),
    ApiResponse({
      status: 200,
      description: 'Template retrieved successfully.',
      type: OfferingDimensionTemplateResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Template not found or out of reach.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateOfferingDimensionTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a dimension template',
      description: 'Only the workspace that owns the template may change it.',
    }),
    ApiParam({ name: 'id', description: 'Dimension template ID' }),
    ApiBody({ type: UpdateOfferingDimensionTemplateDto }),
    ApiResponse({ status: 200, description: 'Template updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 404, description: 'Template not found or out of reach.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteOfferingDimensionTemplate() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a dimension template' }),
    ApiParam({ name: 'id', description: 'Dimension template ID' }),
    ApiResponse({ status: 200, description: 'Template deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 404, description: 'Template not found or out of reach.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSetOfferingDimensionTemplateActive() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activate or deactivate a dimension template',
      description:
        'Separate from editing, and refused while the template has no values — an empty template would seed a dimension with nothing.',
    }),
    ApiParam({ name: 'id', description: 'Dimension template ID' }),
    ApiBody({ type: SetOfferingDimensionTemplateActiveDto }),
    ApiResponse({ status: 200, description: 'Template activation changed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The template has no values to activate.' }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpsertOfferingDimensionTemplateValues() {
  return applyDecorators(
    ApiOperation({
      summary: "Replace a dimension template's values",
      description:
        'Takes the complete set the template should end up with. Values that are unchanged keep their ids; removing every value deactivates the template.',
    }),
    ApiParam({ name: 'id', description: 'Dimension template ID' }),
    ApiBody({ type: UpsertOfferingDimensionTemplateValuesDto }),
    ApiResponse({ status: 200, description: 'Values replaced successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
