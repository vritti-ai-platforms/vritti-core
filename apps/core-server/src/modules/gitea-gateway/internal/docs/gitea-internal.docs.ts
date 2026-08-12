import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { GiteaCredentialsBodyDto } from '../dto/request/gitea-credentials-body.dto';
import { PackageSelectBodyDto } from '../dto/request/package-select-body.dto';
import { PackageTagsSelectBodyDto } from '../dto/request/package-tags-select-body.dto';
import { GiteaCredentialsStatusResponseDto } from '../dto/response/gitea-credentials-status-response.dto';
import { PullTokenResponseDto } from '../dto/response/pull-token-response.dto';

// Every signed-internal endpoint carries the same Ed25519 signature headers, so they are documented once
const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
];

export function ApiGetPullToken() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get website pull token',
      description:
        'Returns the read:package Gitea pull credential for pulling website container images from the Gitea registry. The credential is provisioned and rotated by the deployment agent and read straight from the agent-owned credentials row; core does not mint it. Deployment-scoped (one Gitea per core deployment) so it takes no body. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Pull token retrieved successfully.', type: PullTokenResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 403, description: 'Signature verification failed.' }),
    ApiResponse({ status: 503, description: 'The git service has not been provisioned by the agent yet.' }),
  );
}

export function ApiUpdateGiteaCredentials() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upsert Gitea credentials (signed)',
      description:
        'Writes the Gitea base URL, all-scopes core admin PAT, and read:package pull PAT the deployment agent ' +
        'just provisioned or rotated into the singleton credentials row, then invalidates the in-memory cache so ' +
        'the next read is fresh. Signed by the deployment agent (verified against AGENT_PUBLIC_KEY, not the cloud ' +
        'key). Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: GiteaCredentialsBodyDto }),
    ApiResponse({ status: 200, description: 'Gitea credentials updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Payload is missing or invalid.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetCredentialsStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check Gitea credentials existence (signed)',
      description:
        'Returns whether the singleton Gitea credentials row is already provisioned. The deployment agent ' +
        'calls this before minting so it never rotates tokens on a plain restart (it only mints when the row ' +
        'is absent, or on an explicit rotation). Signed by the deployment agent (AGENT_PUBLIC_KEY). Takes no ' +
        'body; requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiResponse({ status: 200, description: 'Existence reported.', type: GiteaCredentialsStatusResponseDto }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiInternalSelectPackages() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get container package select options (signed)',
      description:
        "Returns paginated container-package options for select dropdowns, scoped to the owner's git namespace. " +
        'Signature-gated equivalent of the session-gated select endpoint, for cloud-server which has no core session. ' +
        'The owner (org subdomain) is supplied by the trusted signed caller.',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: PackageSelectBodyDto }),
    ApiResponse({ status: 200, description: 'Container package select options retrieved successfully.' }),
    ApiResponse({ status: 400, description: 'Owner is missing or invalid.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiInternalSelectPackageTags() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get container package tag select options (signed)',
      description:
        'Returns paginated tag (version) options for a container package, newest first, scoped to the ' +
        "owner's git namespace. Signature-gated equivalent of the session-gated select endpoint, for " +
        'cloud-server which has no core session. The owner (org subdomain) is supplied by the trusted signed caller.',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: PackageTagsSelectBodyDto }),
    ApiResponse({ status: 200, description: 'Container package tag select options retrieved successfully.' }),
    ApiResponse({ status: 400, description: 'Owner or package is missing or invalid.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}
