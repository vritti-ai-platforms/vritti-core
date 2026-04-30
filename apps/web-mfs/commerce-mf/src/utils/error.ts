import type { AxiosError } from 'axios';

// Extracts a human-readable message from an axios error, preferring the RFC 9457 detail field
export function getErrorMessage(error: AxiosError | null | undefined): string {
  if (!error) return 'Unknown error';
  const data = error.response?.data as { detail?: string } | undefined;
  return data?.detail ?? error.message ?? 'Unknown error';
}
