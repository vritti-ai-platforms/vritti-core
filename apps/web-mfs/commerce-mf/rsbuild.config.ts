import fs from 'node:fs';
import { resolve } from 'node:path';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const quantumUI = resolve(__dirname, '../../../..', 'quantum-ui');

const useHttps = process.env.USE_HTTPS === 'true';

export default defineConfig({
  server: {
    port: 3014,
    ...(useHttps && {
      https: {
        key: fs.readFileSync('../../../certs/_wildcard.local.vrittiai.com+4-key.pem'),
        cert: fs.readFileSync('../../../certs/_wildcard.local.vrittiai.com+4.pem'),
      },
    }),
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'commerce',
      filename: 'remoteEntry.js',
      exposes: {
        './Categories': './src/features/categories/index.tsx',
        './Items': './src/features/items/index.tsx',
        './Modifiers': './src/features/modifiers/index.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
        'react-router-dom': { singleton: true },
        '@vritti/quantum-ui': { singleton: true, resolve: quantumUI },
        '@vritti/quantum-ui/theme': { singleton: true, resolve: `${quantumUI}/lib/theme` },
        '@vritti/quantum-ui/context': { singleton: true, resolve: `${quantumUI}/lib/context` },
        '@vritti/quantum-ui/hooks': { singleton: true, resolve: `${quantumUI}/lib/hooks` },
        axios: { singleton: true },
        '@tanstack/react-query': { singleton: true },
      },
      dts: false,
    }),
  ],
  tools: {
    rspack: {
      ignoreWarnings: [/Critical dependency: the request of a dependency is an expression/],
      watchOptions: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/cloud-server/**'],
      },
    },
  },
});
