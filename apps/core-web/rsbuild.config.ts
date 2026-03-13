import fs from 'node:fs';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const isDev = process.env.NODE_ENV !== 'production';

// Load environment variables from .env files
const { publicVars, parsed } = loadEnv();

const useHttps = process.env.USE_HTTPS === 'true';
const protocol = useHttps ? 'https' : 'http';
const host = 'local.vrittiai.com';
const defaultApiHost = `${protocol}://${host}:3001`;

// Static dev remotes enable MF live reload (plugin needs URLs to watch)
const devRemotes: Record<string, string> = {};
if (isDev && parsed.PUBLIC_CLOUD_MF_PORT) {
  devRemotes.VrittiCloud = `vritti_cloud@${protocol}://${host}:${parsed.PUBLIC_CLOUD_MF_PORT}/mf-manifest.json`;
}

export default defineConfig({
  source: {
    define: publicVars, // Inject PUBLIC_ prefixed env vars
  },
  html: {
    tags: [
      {
        tag: 'script',
        head: true,
        append: false, // Insert at beginning of head, before other scripts
        // Inline script to set dark mode before first paint
        children: `(function(){var t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');})();`,
      },
    ],
  },
  server: {
    port: 3013,
    ...(useHttps && {
      https: {
        key: fs.readFileSync('./certs/local.vrittiai.com+4-key.pem'),
        cert: fs.readFileSync('./certs/local.vrittiai.com+4.pem'),
      },
    }),
    proxy: {
      '/api': {
        target: process.env.REACT_API_HOST || defaultApiHost,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates in local development
        pathRewrite: (reqPath) => reqPath.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'vritti_nexus_host',
      remotes: devRemotes,
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^19.2.0',
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^19.2.0',
          eager: true,
        },
        'react-router-dom': {
          singleton: true,
          eager: true,
        },
        '@vritti/quantum-ui': {
          singleton: true,
          eager: true,
        },
        '@vritti/quantum-ui/theme': {
          singleton: true,
          eager: true,
        },
        axios: {
          singleton: true,
          eager: true,
        },
        '@tanstack/react-query': {
          singleton: true,
          eager: true,
        },
      },
      dts: false,
    }),
  ],
  // PostCSS configuration is in postcss.config.mjs
});
