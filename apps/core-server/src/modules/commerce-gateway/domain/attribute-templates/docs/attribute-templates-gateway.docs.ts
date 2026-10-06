import { CreateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/create-attribute-template.dto';
import { SetAttributeTemplateActiveDto } from '@commerce/attribute-templates/dto/request/set-attribute-template-active.dto';
import { UpdateAttributeTemplateDto } from '@commerce/attribute-templates/dto/request/update-attribute-template.dto';
import { UpsertAttributeTemplateValuesDto } from '@commerce/attribute-templates/dto/request/upsert-attribute-template-values.dto';
import { AttributeTemplateResponseDto } from '@commerce/attribute-templates/dto/response/attribute-template-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

// Shared by the org, le and site controllers — the three surfaces are identical, and the workspace
// header decides which templates are reachable, so one set of docs describes all of them.
export function ApiListAttributeTemplates() {
  return applyDecorators(
    ApiOperation({
      summary: 'List attribute templates',
      description:
        'Returns every template this workspace can reach — org-owned ones plus its own — each with its values.',
    }),
    ApiQuery({ name: 'search', required: false, description: 'Filter by name or description' }),
    ApiResponse({
      status: 200,
      description: 'Attribute templates retrieved successfully.',
      type: [AttributeTemplateResponseDto],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateAttributeTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an attribute template',
      description:
        'Creates a template owned by the calling workspace. The owner is derived from the workspace context, never from the request body.',
    }),
    ApiBody({ type: CreateAttributeTemplateDto }),
    ApiResponse({
      status: 201,
      description: 'Attribute template created successfully.',
      type: AttributeTemplateResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 409, description: 'A template with this name already exists in this workspace.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateAttributeTemplate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an attribute template',
      description: 'Only the workspace that owns the template may change it.',
    }),
    ApiParam({ name: 'id', description: 'Attribute template ID' }),
    ApiBody({ type: UpdateAttributeTemplateDto }),
    ApiResponse({ status: 200, description: 'Template updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 404, description: 'Template not found or out of reach.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteAttributeTemplate() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an attribute template' }),
    ApiParam({ name: 'id', description: 'Attribute template ID' }),
    ApiResponse({ status: 200, description: 'Template deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 404, description: 'Template not found or out of reach.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSetAttributeTemplateActive() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activate or deactivate an attribute template',
      description:
        'Separate from editing, and refused while the template has no values — an empty template would seed an attribute with nothing.',
    }),
    ApiParam({ name: 'id', description: 'Attribute template ID' }),
    ApiBody({ type: SetAttributeTemplateActiveDto }),
    ApiResponse({ status: 200, description: 'Template activation changed.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'The template has no values to activate.' }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpsertAttributeTemplateValues() {
  return applyDecorators(
    ApiOperation({
      summary: "Replace an attribute template's values",
      description:
        'Takes the complete set the template should end up with. Values that are unchanged keep their ids; removing every value deactivates the template.',
    }),
    ApiParam({ name: 'id', description: 'Attribute template ID' }),
    ApiBody({ type: UpsertAttributeTemplateValuesDto }),
    ApiResponse({ status: 200, description: 'Values replaced successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'The template belongs to a wider scope.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
