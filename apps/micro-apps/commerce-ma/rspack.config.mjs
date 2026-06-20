import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../..');
const quantumUiNative = path.resolve(__dirname, '../../../..', 'quantum-ui-native');

// ---------------------------------------------------------------------------
// Env loading — shares core-app's .env as single source of truth
// ---------------------------------------------------------------------------

const coreAppDir = path.resolve(workspaceRoot, 'apps/core-app');
const appEnv = process.env.APP_ENV ?? 'development';

for (const file of [`.env`, `.env.${appEnv}`, `.env.local`, `.env.${appEnv}.local`]) {
  dotenvExpand(dotenv.config({ path: path.join(coreAppDir, file), override: false }));
}

const isDev = appEnv === 'development';
const devHost = process.env.DEV_HOST?.trim();

if (isDev && !devHost) {
  throw new Error(
    `DEV_HOST is required in development. Set it in ${path.join(coreAppDir, '.env')} to your LAN IP, for example 192.168.1.57`,
  );
}

// ---------------------------------------------------------------------------
// react-native-css subpath aliases (hoisted monorepo packages)
// ---------------------------------------------------------------------------

const rnCssRoot = path.dirname(require.resolve('react-native-css/package.json'));
const rnCssAliases = {
  'react-native-css/native-internal': path.join(rnCssRoot, 'dist/commonjs/native-internal/index.js'),
  'react-native-css/utilities': path.join(rnCssRoot, 'dist/commonjs/utilities/index.js'),
  'react-native-css/compiler': path.join(rnCssRoot, 'dist/commonjs/compiler/index.js'),
  'react-native-css/native': path.join(rnCssRoot, 'dist/commonjs/native/index.js'),
};
const rnCssComponentsPath = path.join(rnCssRoot, 'dist/commonjs/components/index.cjs');

// ---------------------------------------------------------------------------
// @vritti/quantum-ui-native subpath aliases → source files
// ---------------------------------------------------------------------------

const componentDirs = [
  'Avatar',
  'Badge',
  'BottomNavigation',
  'BottomSheet',
  'Button',
  'Card',
  'CardPressable',
  'Checkbox',
  'DatePicker',
  'DateRangePicker',
  'DateTimePicker',
  'DateTimeRangePicker',
  'DynamicIcon',
  'FlashList',
  'Form',
  'FormattedDate',
  'Label',
  'ListItem',
  'NativeStack',
  'Progress',
  'PushNavigator',
  'RadioGroup',
  'ScreenContainer',
  'ScreenHeader',
  'Select',
  'Separator',
  'Skeleton',
  'Spinner',
  'SplashScreen',
  'StaticAlert',
  'Switch',
  'TextField',
  'Text',
  'TreeView',
];

// @vritti/quantum-ui-native/selects/<entity> subpaths (mirrors quantum-ui/lib/selects)
const selectDirs = [
  'category',
  'cost-category',
  'currency',
  'customer',
  'inventory-item',
  'locale',
  'location',
  'lot',
  'purchase-order',
  'purchase-order-item',
  'quant',
  'serial',
  'supplier',
  'supplier-item',
  'tax-group',
  'timezone',
  'uom',
  'user',
];

const quantumAliases = {
  '@vritti/quantum-ui-native/utils': path.join(quantumUiNative, 'lib/utils/index.ts'),
  '@vritti/quantum-ui-native/hooks': path.join(quantumUiNative, 'lib/hooks/index.ts'),
  '@vritti/quantum-ui-native/config': path.join(quantumUiNative, 'lib/config/index.ts'),
  '@vritti/quantum-ui-native/context': path.join(quantumUiNative, 'lib/context/index.ts'),
  '@vritti/quantum-ui-native/theme': path.join(quantumUiNative, 'lib/theme/index.ts'),
  '@vritti/quantum-ui-native/types': path.join(quantumUiNative, 'lib/types/index.ts'),
  ...Object.fromEntries(
    componentDirs.map((dir) => [
      `@vritti/quantum-ui-native/${dir}`,
      path.join(quantumUiNative, `lib/components/${dir}/index.ts`),
    ]),
  ),
  // Per-entity select subpaths (must precede the aggregate + main entry — first matching alias wins)
  ...Object.fromEntries(
    selectDirs.map((dir) => [
      `@vritti/quantum-ui-native/selects/${dir}`,
      path.join(quantumUiNative, `lib/selects/${dir}/index.ts`),
    ]),
  ),
  '@vritti/quantum-ui-native/selects': path.join(quantumUiNative, 'lib/selects/index.ts'),
  '@vritti/quantum-ui-native': path.join(quantumUiNative, 'lib/index.tsx'),
};

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
export default (rspackEnv) => {
  const { platform, mode } = rspackEnv;
  const isNative = platform !== 'web';
  const rspack = require('@rspack/core');

  return {
    mode,
    context: __dirname,
    entry: './src/index.ts',
    devtool: mode === 'development' ? 'source-map' : false,

    resolve: {
      ...Repack.getResolveOptions(platform),
      conditionNames: ['react-native', 'require', 'import', 'node', 'default'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(workspaceRoot, 'node_modules'),
        path.resolve(quantumUiNative, 'node_modules'),
        'node_modules',
      ],
      alias: {
        ...quantumAliases,
        ...rnCssAliases,
        'react-native-css/components': path.join(rnCssRoot, 'dist/commonjs/components'),
        'colorjs.io/fn': require.resolve('colorjs.io/fn'),
        '@react-navigation/elements/internal': path.join(
          path.dirname(require.resolve('@react-navigation/elements/package.json')),
          'lib/module/internal.js',
        ),
      },
    },

    resolveLoader: {
      modules: [
        path.resolve(workspaceRoot, 'node_modules'),
        path.resolve(quantumUiNative, 'node_modules'),
        'node_modules',
      ],
    },

    output: {
      path: '[context]/build/[platform]',
      uniqueName: 'commerce_ma',
      ...(isDev ? { publicPath: `http://${devHost}:9002/[platform]/` } : {}),
    },

    module: {
      rules: [
        {
          test: /\.[cm]?[jt]sx?$/,
          type: 'javascript/auto',
          use: {
            loader: '@callstack/repack/babel-swc-loader',
            parallel: true,
            options: {},
          },
        },
        ...Repack.getAssetTransformRules(),
        ...(isNative
          ? [
              {
                test: /\.css$/,
                use: [
                  {
                    loader: path.resolve(__dirname, 'rn-css-loader.js'),
                    options: { projectRoot: __dirname },
                  },
                  {
                    loader: 'postcss-loader',
                    options: {
                      postcssOptions: {
                        plugins: { '@tailwindcss/postcss': {} },
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },

    plugins: [
      new Repack.RepackPlugin({
        extraChunks: [
          {
            include: /.*/,
            type: 'remote',
            outputPath: `build/${platform}/output-remote`,
          },
        ],
      }),
      new ReanimatedPlugin({ unstable_disableTransform: true }),

      new Repack.plugins.ModuleFederationPluginV2({
        name: 'commerce_ma',
        filename: 'commerce-ma.container.js.bundle',
        dts: false,
        // TEMPORARY — logs share resolution to name the module behind "getter is not a function". Remove after diagnosis.
        runtimePlugins: [path.resolve(__dirname, 'src/mf-share-logger.ts')],
        exposes: {
          './Categories': './src/features/categories/index.tsx',
          './CreditNotes': './src/features/credit-notes/index.tsx',
          './Customers': './src/features/customers/index.tsx',
          './GoodsReceipts': './src/features/goods-receipts/index.tsx',
          './InventoryItems': './src/features/inventory-items/index.tsx',
          './StorageLocations': './src/features/storage-locations/index.tsx',
          './Invoices': './src/features/invoices/index.tsx',
          './Items': './src/features/items/index.tsx',
          './Modifiers': './src/features/modifiers/index.tsx',
          './Orders': './src/features/orders/index.tsx',
          './POSTerminals': './src/features/pos/index.tsx',
          './POSBilling': './src/features/pos-billing/index.tsx',
          './PriceLists': './src/features/price-lists/index.tsx',
          './PurchaseOrders': './src/features/purchase-orders/index.tsx',
          './StockAdjustments': './src/features/stock-adjustments/index.tsx',
          './StockTransfers': './src/features/stock-transfers/index.tsx',
          './Suppliers': './src/features/suppliers/index.tsx',
          './TaxGroups': './src/features/tax-groups/index.tsx',
          './UOM': './src/features/uom/index.tsx',
        },
        shared: {
          react: { singleton: true, eager: false, import: false, requiredVersion: '19.2.3' },
          'react-native': { singleton: true, eager: false, import: false, requiredVersion: '0.83.2' },
          // react-native deep imports (react-native/Libraries/...): Re.Pack auto-adds a 'react-native/'
          // prefix share inheriting react-native's import:false above, making EVERY deep import a
          // host-only consume with no fallback. datetimepicker (bundled by this micro-app) imports RN
          // internals the host never pulls into its own graph (e.g. codegenNativeComponent) → loadShare
          // returns false → undefined getter → "getter is not a function". Declaring it here WITHOUT
          // import:false overrides the auto-share: deep imports still prefer the host's single instance
          // but fall back to a locally bundled copy instead of crashing.
          'react-native/': { singleton: true, eager: false, requiredVersion: '*' },
          // version pinned — MF can't auto-detect it from these packages' subpath package.json; >=0.0.0-0 matches prereleases
          '@react-navigation/native': {
            singleton: true,
            eager: false,
            import: false,
            version: '8.0.0-alpha.17',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/native-stack': {
            singleton: true,
            eager: false,
            import: false,
            version: '8.0.0-alpha.25',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/elements': {
            singleton: true,
            eager: false,
            import: false,
            version: '3.0.0-alpha.20',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/bottom-tabs': {
            singleton: true,
            eager: false,
            import: false,
            version: '8.0.0-alpha.22',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-safe-area-context': { singleton: true, eager: false, import: false, requiredVersion: '^5.7.0' },
          'react-native-screens': { singleton: true, eager: false, import: false, requiredVersion: '^4.24.0' },
          // Apollo client + cache come from the HOST (shared singleton). commerce-ma consumes the
          // host's one ApolloClient — it does not create its own.
          '@apollo/client': { singleton: true, eager: false, import: false },
          '@apollo/client/react': { singleton: true, eager: false, import: false },
          graphql: { singleton: true, eager: false, import: false },
          axios: { singleton: true, eager: false, import: false },
          '@gorhom/bottom-sheet': { singleton: true, eager: false, import: false },
          '@vritti/quantum-ui-native': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          '@vritti/quantum-ui-native/BottomSheet': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          // Consume the host's Select so its async axios is configured + authenticated
          // (this micro-app never configures its own copy) and its popover uses the host portal.
          '@vritti/quantum-ui-native/Select': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          // Consume the host's axios/config (import: false → never bundle our own). Direct `axios`
          // imports in this micro-app then use the host's configured + authenticated instance;
          // otherwise our own copy keeps the default relative '/api' → requests hit file:///api/...
          '@vritti/quantum-ui-native/utils': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          '@vritti/quantum-ui-native/config': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          '@rn-primitives/portal': { singleton: true, eager: false, import: false },
          'react-native-reanimated': { singleton: true, eager: false, import: false, requiredVersion: '>=0.0.0-0' },
          'react-native-worklets': { singleton: true, eager: false, import: false, requiredVersion: '>=0.0.0-0' },
          nativewind: {
            singleton: true,
            eager: false,
            import: false,
            version: '5.0.0-preview.3',
            requiredVersion: '>=0.0.0-0',
          },
          // native modules — must be singletons so each registers its native views exactly once
          // NOTE: @react-native-community/datetimepicker is intentionally NOT shared. The host never
          // imports a date picker, so it can't provide the singleton; a remote-provided shared entry
          // fails to register and the consume throws "getter is not a function". commerce-ma bundles its
          // own copy — the native view still registers once (the host has no copy). Revisit (share via a
          // host-provided entry) if the host itself starts rendering date pickers.
          'react-native-svg': {
            singleton: true,
            eager: false,
            import: false,
            version: '15.15.4',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-sfsymbols': {
            singleton: true,
            eager: false,
            import: false,
            version: '1.2.2',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-native-vector-icons/material-icons': {
            singleton: true,
            eager: false,
            import: false,
            version: '12.5.0',
            requiredVersion: '>=0.0.0-0',
          },
          '@callstack/liquid-glass': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.7.1',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-gesture-handler': {
            singleton: true,
            eager: false,
            import: false,
            version: '2.31.2',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-nitro-modules': {
            singleton: true,
            eager: false,
            import: false,
            version: '0.35.4',
            requiredVersion: '>=0.0.0-0',
          },
        },
      }),

      ...(isNative
        ? [
            new rspack.NormalModuleReplacementPlugin(/^react-native-css\/components\/.+$/, (resource) => {
              resource.request = rnCssComponentsPath;
            }),
            new rspack.NormalModuleReplacementPlugin(/^react-native-css\/react-native$/, (resource) => {
              resource.request = rnCssComponentsPath;
            }),
            new rspack.NormalModuleReplacementPlugin(/react-native-css-metro-override/, require.resolve('./noop.js')),
          ]
        : []),
    ],
  };
};
