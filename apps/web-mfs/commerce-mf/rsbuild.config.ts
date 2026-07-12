import fs from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const quantumUI = resolve(__dirname, '../../../..', 'quantum-ui');

// quantum-ui MF sharing is conditional on how it's installed:
// - LOCAL link (pnpm-workspace override → the sibling repo): the symlink breaks
//   MF's exports-based subpath resolution, so each share needs an explicit
//   `resolve` to the local lib/ source.
// - NPM package: resolves via its exports map and ships dist only (no lib/), so
//   the resolve path wouldn't exist — omit it.
// Detect by lib/ presence: it exists only in the linked source, never in npm dist.
const isLocalQuantumUI = fs.existsSync(resolve(quantumUI, 'lib', 'theme'));
const quantumUIShared = isLocalQuantumUI
  ? {
      '@vritti/quantum-ui': { singleton: true, resolve: quantumUI },
      '@vritti/quantum-ui/theme': { singleton: true, resolve: `${quantumUI}/lib/theme` },
      '@vritti/quantum-ui/context': { singleton: true, resolve: `${quantumUI}/lib/context` },
      '@vritti/quantum-ui/hooks': { singleton: true, resolve: `${quantumUI}/lib/hooks` },
      // The permission gate context must be the host's instance, or gated Buttons in the remote see no provider
      '@vritti/quantum-ui/PermissionGate': {
        singleton: true,
        resolve: `${quantumUI}/lib/components/PermissionGate`,
      },
    }
  : {
      '@vritti/quantum-ui': { singleton: true },
      '@vritti/quantum-ui/theme': { singleton: true },
      '@vritti/quantum-ui/context': { singleton: true },
      '@vritti/quantum-ui/hooks': { singleton: true },
      '@vritti/quantum-ui/PermissionGate': { singleton: true },
    };

const useHttps = process.env.USE_HTTPS === 'true';

export default defineConfig({
  // Federated remote: its chunks must load from where remoteEntry.js is served
  // (mf.<domain>/commerce-mf/), NOT the host origin. 'auto' derives the public
  // path from the runtime script location — correct in dev (:3014) and prod
  // (mf.dev.vrittiai.com/commerce-mf) without hardcoding a URL.
  output: {
    assetPrefix: 'auto',
  },
  server: {
    port: 3014,
    host: '0.0.0.0',
    historyApiFallback: true,
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
        './Org/Categories': './src/org/features/categories/index.tsx',
        './Org/SalesChannels': './src/org/features/sales-channels/index.tsx',
        './Org/UOM': './src/org/features/uom/index.tsx',
        './Le/CostCategories': './src/le/features/cost-categories/index.tsx',
        './Le/TaxGroups': './src/le/features/tax-groups/index.tsx',
        './Site/Catalogs': './src/site/features/catalogs/index.tsx',
        './Site/CreditNotes': './src/site/features/credit-notes/index.tsx',
        './Site/Customers': './src/site/features/customers/index.tsx',
        './Site/GoodsReceipts': './src/site/features/goods-receipts/index.tsx',
        './Site/InventoryItems': './src/site/features/inventory-items/index.tsx',
        './Site/Invoices': './src/site/features/invoices/index.tsx',
        './Site/Locations': './src/site/features/locations/index.tsx',
        './Site/Orders': './src/site/features/orders/index.tsx',
        './Site/POSTerminals': './src/site/features/pos/index.tsx',
        './Site/PurchaseOrders': './src/site/features/purchase-orders/index.tsx',
        './Site/StockAdjustments': './src/site/features/stock-adjustments/index.tsx',
        './Site/StockTransfers': './src/site/features/stock-transfers/index.tsx',
        './Site/Suppliers': './src/site/features/suppliers/index.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.2.0' },
        'react-router-dom': { singleton: true },
        ...quantumUIShared,
        axios: { singleton: true },
        '@tanstack/react-query': { singleton: true },
      },
      dts: false,
    }),
  ],
  tools: {
    rspack: {
      ignoreWarnings: [
        /Critical dependency: the request of a dependency is an expression/,
        /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      ],
      watchOptions: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/cloud-server/**'],
      },
    },
  },
});
