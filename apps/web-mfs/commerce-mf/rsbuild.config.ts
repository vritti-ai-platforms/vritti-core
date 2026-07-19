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
        './Org/Categories': './src/features/organization/categories/index.tsx',
        './Org/Companies': './src/features/organization/companies/index.tsx',
        './Org/InventoryItems': './src/features/organization/inventory-items/index.tsx',
        './Org/People': './src/features/organization/people/index.tsx',
        './Org/SalesChannels': './src/features/organization/sales-channels/index.tsx',
        './Org/TaxClasses': './src/features/organization/tax-classes/index.tsx',
        './Org/TaxComponents': './src/features/organization/tax-components/index.tsx',
        './Org/TaxJurisdictions': './src/features/organization/tax-jurisdictions/index.tsx',
        './Org/UOM': './src/features/organization/uom/index.tsx',
        './Le/CostCategories': './src/features/legal-entity/cost-categories/index.tsx',
        './Le/Suppliers': './src/features/legal-entity/suppliers/index.tsx',
        './Le/TaxGroups': './src/features/legal-entity/tax-groups/index.tsx',
        './SiteGroup/InventoryItems': './src/features/site-group/inventory-items/index.tsx',
        './Site/Catalogs': './src/features/site/catalogs/index.tsx',
        './Site/CreditNotes': './src/features/site/credit-notes/index.tsx',
        './Site/Customers': './src/features/site/customers/index.tsx',
        './Site/GoodsReceipts': './src/features/site/goods-receipts/index.tsx',
        './Site/InventoryItems': './src/features/site/inventory-items/index.tsx',
        './Site/Invoices': './src/features/site/invoices/index.tsx',
        './Site/Locations': './src/features/site/locations/index.tsx',
        './Site/Orders': './src/features/site/orders/index.tsx',
        './Site/POSTerminals': './src/features/site/pos/index.tsx',
        './Site/PurchaseOrders': './src/features/site/purchase-orders/index.tsx',
        './Site/StockAdjustments': './src/features/site/stock-adjustments/index.tsx',
        './Site/StockTransfers': './src/features/site/stock-transfers/index.tsx',
        './Site/Suppliers': './src/features/site/suppliers/index.tsx',
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
