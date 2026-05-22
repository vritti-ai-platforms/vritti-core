import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';
import dotenv from 'dotenv';
import { expand as dotenvExpand } from 'dotenv-expand';
import { envSchema } from './env.schema.mjs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../');
const quantumUiNative = path.resolve(__dirname, '../../..', 'quantum-ui-native');

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

const appEnv = process.env.APP_ENV ?? 'development';

// Load cascade: .env → .env.<mode> → .env.local → .env.<mode>.local
for (const file of [`.env`, `.env.${appEnv}`, `.env.local`, `.env.${appEnv}.local`]) {
  dotenvExpand(dotenv.config({ path: path.join(__dirname, file), override: false }));
}

// Validate with zod — throws a descriptive error on missing/malformed keys
const env = envSchema.parse({
  APP_ENV: process.env.APP_ENV ?? appEnv,
  DEV_HOST: process.env.DEV_HOST,
  DEPLOYMENTS_API_BASE_URL: process.env.DEPLOYMENTS_API_BASE_URL,
});

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
  'BottomSheet',
  'BottomNavigation',
  'Button',
  'Card',
  'CardPressable',
  'Checkbox',
  'DynamicIcon',
  'FlashList',
  'Form',
  'Input',
  'Label',
  'ListItem',
  'NativeStack',
  'PasswordField',
  'Progress',
  'PushNavigator',
  'RadioGroup',
  'ScreenContainer',
  'ScreenHeader',
  'Separator',
  'Skeleton',
  'Spinner',
  'SplashScreen',
  'StaticAlert',
  'Switch',
  'TextField',
  'Typography',
];

const quantumAliases = {
  // Non-component subpaths
  '@vritti/quantum-ui-native/utils': path.join(quantumUiNative, 'lib/utils/index.ts'),
  '@vritti/quantum-ui-native/hooks': path.join(quantumUiNative, 'lib/hooks/index.ts'),
  '@vritti/quantum-ui-native/config': path.join(quantumUiNative, 'lib/config/index.ts'),
  '@vritti/quantum-ui-native/context': path.join(quantumUiNative, 'lib/context/index.ts'),
  '@vritti/quantum-ui-native/theme': path.join(quantumUiNative, 'lib/theme/index.ts'),
  '@vritti/quantum-ui-native/types': path.join(quantumUiNative, 'lib/types/index.ts'),
  // Component subpaths
  ...Object.fromEntries(
    componentDirs.map((dir) => [
      `@vritti/quantum-ui-native/${dir}`,
      path.join(quantumUiNative, `lib/components/${dir}/index.ts`),
    ]),
  ),
  // Main entry (must come AFTER subpath aliases)
  '@vritti/quantum-ui-native': path.join(quantumUiNative, 'lib/index.tsx'),
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
export default (rspackEnv) => {
  const { platform, mode } = rspackEnv;
  const isNative = platform !== 'web';
  const rspack = require('@rspack/core');
  const isDev = env.APP_ENV === 'development';

  return {
    mode,
    context: __dirname,
    entry: './src/host/index.tsx',
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
        '@module-federation/enhanced/runtime': require.resolve('@module-federation/enhanced/runtime'),
        '@module-federation/runtime-tools/runtime': require.resolve('@module-federation/runtime-tools/runtime'),
        '@module-federation/runtime': require.resolve('@module-federation/runtime'),
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
      path: '[context]/build/host-app/[platform]',
      uniqueName: 'vritti-core-app',
      ...(isDev ? { publicPath: `http://${env.DEV_HOST}:8081/[platform]/` } : {}),
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

        // Assets
        ...Repack.getAssetTransformRules(),

        // CSS: PostCSS (Tailwind v4) -> rn-css-loader (react-native-css compiler)
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
      new rspack.DefinePlugin({
        __APP_CONFIG__: JSON.stringify({
          appEnv: env.APP_ENV,
          devHost: isDev ? env.DEV_HOST : undefined,
          deploymentsApiBaseUrl: env.DEPLOYMENTS_API_BASE_URL,
        }),
      }),
      new Repack.RepackPlugin({
        extraChunks: [
          {
            include: /.*/,
            type: 'remote',
            outputPath: `build/host-app/${platform}/output-remote`,
          },
        ],
      }),
      new ReanimatedPlugin({ unstable_disableTransform: true }),

      new Repack.plugins.ModuleFederationPluginV2({
        name: 'vritti_core_app',
        filename: 'vritti_core_app.container.js.bundle',
        dts: false,
        shared: {
          react: { singleton: true, eager: true, requiredVersion: '19.2.3' },
          'react-native': { singleton: true, eager: true, requiredVersion: '0.83.2' },
          // version pinned — MF can't auto-detect it from these packages' subpath package.json; >=0.0.0-0 matches prereleases
          '@react-navigation/native': {
            singleton: true,
            eager: true,
            version: '8.0.0-alpha.17',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/native-stack': {
            singleton: true,
            eager: true,
            version: '8.0.0-alpha.25',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/elements': {
            singleton: true,
            eager: true,
            version: '3.0.0-alpha.20',
            requiredVersion: '>=0.0.0-0',
          },
          '@react-navigation/bottom-tabs': {
            singleton: true,
            eager: true,
            version: '8.0.0-alpha.22',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-safe-area-context': { singleton: true, eager: true, requiredVersion: '^5.7.0' },
          'react-native-screens': { singleton: true, eager: true, requiredVersion: '^4.24.0' },
          '@tanstack/react-query': { singleton: true, eager: true },
          axios: { singleton: true, eager: true },
          '@gorhom/bottom-sheet': { singleton: true, eager: true },
          '@vritti/quantum-ui-native/BottomSheet': {
            singleton: true,
            eager: true,
            version: '0.1.0',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-reanimated': { singleton: true, eager: true },
          'react-native-worklets': { singleton: true, eager: true, requiredVersion: '0.8.1' },
          nativewind: { singleton: true, eager: true, version: '5.0.0-preview.3', requiredVersion: '>=0.0.0-0' },
          // native modules — must be singletons so each registers its native views exactly once
          'react-native-svg': { singleton: true, eager: true, version: '15.15.4', requiredVersion: '>=0.0.0-0' },
          'react-native-sfsymbols': { singleton: true, eager: true, version: '1.2.2', requiredVersion: '>=0.0.0-0' },
          '@react-native-vector-icons/material-icons': {
            singleton: true,
            eager: true,
            version: '12.5.0',
            requiredVersion: '>=0.0.0-0',
          },
          '@callstack/liquid-glass': { singleton: true, eager: true, version: '0.7.1', requiredVersion: '>=0.0.0-0' },
          'react-native-gesture-handler': {
            singleton: true,
            eager: true,
            version: '2.31.2',
            requiredVersion: '>=0.0.0-0',
          },
          'react-native-nitro-modules': {
            singleton: true,
            eager: true,
            version: '0.35.4',
            requiredVersion: '>=0.0.0-0',
          },
        },
      }),

      // react-native-css component resolution fixes
      ...(isNative
        ? [
            new rspack.NormalModuleReplacementPlugin(/^react-native-css\/components\/.+$/, (resource) => {
              resource.request = rnCssComponentsPath;
            }),
            new rspack.NormalModuleReplacementPlugin(/^react-native-css\/react-native$/, (resource) => {
              resource.request = rnCssComponentsPath;
            }),
            // Stub out Metro setup check — not needed with Re.Pack
            new rspack.NormalModuleReplacementPlugin(/react-native-css-metro-override/, require.resolve('./noop.js')),
          ]
        : []),
    ],
  };
};
