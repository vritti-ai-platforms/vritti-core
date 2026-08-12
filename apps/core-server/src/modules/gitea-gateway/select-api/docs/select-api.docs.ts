import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

// Shared across every gitea select endpoint. The org namespace is resolved from the session host
// (not a query param), so it is not documented here.
const BASE_SELECT_QUERIES = [
  ApiQuery({ name: 'search', description: 'Search term to filter options by name', required: false }),
  ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
  ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
  ApiQuery({ name: 'values', description: 'Comma-separated values to fetch specific options', required: false }),
  ApiQuery({ name: 'excludeIds', description: 'Comma-separated values to exclude', required: false }),
];

export function ApiSelectRepositories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get repository select options',
      description: "Returns paginated repository options for select dropdowns, scoped to the org's git namespace.",
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Repository select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSelectPackages() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get container package select options',
      description:
        "Returns paginated container-package options for select dropdowns, scoped to the org's git namespace. " +
        'Package names are collapsed to distinct values (the registry lists one entry per version).',
    }),
    ...BASE_SELECT_QUERIES,
    ApiResponse({ status: 200, description: 'Container package select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSelectPackageTags() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get container package tag select options',
      description:
        'Returns paginated tag (version) options for a container package, newest first. Used by the ' +
        'website-creation package selector to pick an image tag.',
    }),
    ...BASE_SELECT_QUERIES,
    ApiQuery({ name: 'package', description: 'Container package name whose tags to list', required: true }),
    ApiResponse({ status: 200, description: 'Container package tag select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}
