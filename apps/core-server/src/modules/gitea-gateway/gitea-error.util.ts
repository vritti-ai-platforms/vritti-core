import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@vritti/api-sdk/exceptions';
import { isAxiosError } from 'axios';

// Gitea reports failures as { message, url } regardless of status code
interface GiteaApiError {
  message?: string;
  url?: string;
}

// Rethrows a failed Gitea call. Unlike the cloud→core path, upstream bodies are NOT forwarded
// verbatim: Gitea answers with { message, url } rather than RFC 9457, and its messages leak
// instance internals — so each status is mapped to an equivalent problem instead.
export function rethrowGiteaError(error: unknown, detail: string): never {
  if (!isAxiosError(error)) {
    throw error instanceof Error ? error : new InternalServerErrorException('Git service request failed.');
  }

  const status = error.response?.status;

  // No response at all — connection refused, DNS failure, or timeout
  if (status === undefined) {
    throw new ServiceUnavailableException({ label: 'Git Service Unreachable', detail });
  }

  const upstream = (error.response?.data as GiteaApiError | undefined)?.message;

  switch (status) {
    case 401:
    case 403:
      // A rejected admin token is a deployment fault, never the caller's — don't echo it outward
      throw new InternalServerErrorException('Git service credentials are invalid.');
    case 404:
      throw new NotFoundException('Not found in the git service.');
    case 409:
    case 422:
      throw new ConflictException({
        label: 'Git Service Conflict',
        detail: upstream ?? 'That name is already taken in the git service.',
      });
    default:
      throw new InternalServerErrorException('Git service request failed.');
  }
}
