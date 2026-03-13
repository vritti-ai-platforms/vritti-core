/// <reference types="@rsbuild/core/types" />

/**
 * Type declarations for custom environment variables
 *
 * Rsbuild exposes PUBLIC_ prefixed environment variables to the client.
 * Add new environment variables here to get type safety and autocomplete.
 */
interface ImportMetaEnv {
  // Module Federation remote ports (local development)
  readonly PUBLIC_CLOUD_MF_PORT?: string;

  // Module Federation base URL (production)
  readonly PUBLIC_MF_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
