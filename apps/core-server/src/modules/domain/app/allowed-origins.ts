import { ValidateBy, type ValidationOptions } from 'class-validator';

export const MAX_ALLOWED_ORIGINS = 20;

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

// Parses a URL and returns it only when it may be a storefront page: https anywhere, http only on the local machine
export function parseStorefrontUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol === 'https:') return url;
  if (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname)) return url;
  return null;
}

// The canonical origin an allowed-origins entry names, or null when it is not a bare origin (a path, query or
// fragment, credentials, or a protocol other than the storefront ones). A trailing slash and letter case are forgiven
export function normalizeOrigin(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const url = parseStorefrontUrl(trimmed);
  if (!url) return null;
  if (url.pathname !== '/' || url.search || url.hash || trimmed.includes('?') || trimmed.includes('#')) return null;
  return url.origin === trimmed.replace(/\/$/, '').toLowerCase() ? url.origin : null;
}

// Normalizes and dedupes a list of origins, dropping anything that is not one
export function normalizeOrigins(values: readonly string[]): string[] {
  const origins = values.map(normalizeOrigin).filter((origin): origin is string => origin !== null);
  return [...new Set(origins)];
}

// The origin of a storefront URL when it is one of the allowed origins, otherwise null
export function allowedOriginOf(value: string, allowedOrigins: readonly string[]): string | null {
  const url = parseStorefrontUrl(value);
  if (!url) return null;
  return allowedOrigins.includes(url.origin) ? url.origin : null;
}

// Validates that a string is a bare storefront origin — see normalizeOrigin
export function IsStorefrontOrigin(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isStorefrontOrigin',
      validator: {
        validate: (value: unknown) => normalizeOrigin(value) !== null,
        defaultMessage: () =>
          'Each origin must be scheme, host and optional port only (e.g. https://shop.example) — https, or http on localhost',
      },
    },
    options,
  );
}
