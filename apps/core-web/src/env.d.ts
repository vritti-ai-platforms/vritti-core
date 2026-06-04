/// <reference types="@rsbuild/core/types" />

export {};

declare global {
  interface ImportMetaEnv {
    // Module Federation remote ports (local development)
    readonly PUBLIC_CLOUD_MF_PORT?: string;
    readonly PUBLIC_COMMERCE_MF_PORT?: string;

    // Module Federation base URL (production)
    readonly PUBLIC_MF_BASE_URL?: string;
  }
}

declare module 'react-phone-number-input/style.css' {}
declare module '*.css' {}
