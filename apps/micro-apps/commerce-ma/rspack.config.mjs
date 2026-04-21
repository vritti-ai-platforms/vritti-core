import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../..');
const quantumUiNative = path.resolve(__dirname, '../../../..', 'quantum-ui-native');
const coreAppEnvFilePath = path.resolve(workspaceRoot, 'apps/core-app/.env');

function loadCoreAppEnv() {
  if (!fs.existsSync(coreAppEnvFilePath)) {
    return;
  }

  const envFile = fs.readFileSync(coreAppEnvFilePath, 'utf8');

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function validateDevMfHost(rawValue) {
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(
      `DEV_MF_HOST is required in development. Set it in ${coreAppEnvFilePath} or the shell to your laptop LAN IP or hostname, for example 192.168.1.23`,
    );
  }

  if (value.includes('://')) {
    throw new Error(
      `DEV_MF_HOST must be a host or IP only, without a protocol. Received: ${value}`,
    );
  }

  let parsed;
  try {
    parsed = new URL(`http://${value}`);
  } catch {
    throw new Error(`DEV_MF_HOST must be a valid host or IP. Received: ${value}`);
  }

  if (parsed.pathname && parsed.pathname !== '/') {
    throw new Error(
      `DEV_MF_HOST must not include a path like "${parsed.pathname}". Use only the host or IP, for example 192.168.1.23`,
    );
  }

  if (parsed.search || parsed.hash) {
    throw new Error('DEV_MF_HOST must not include query params or a hash fragment.');
  }

  if (parsed.port) {
    throw new Error('DEV_MF_HOST must not include a port. The dev remote ports are configured separately.');
  }

  return parsed.hostname;
}

loadCoreAppEnv();

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
  'Alert',
  'Avatar',
  'Badge',
  'BottomNavigation',
  'Button',
  'Card',
  'Checkbox',
  'DynamicIcon',
  'FlashList',
  'Form',
  'Input',
  'Label',
  'NativeStack',
  'Progress',
  'RadioGroup',
  'Separator',
  'Skeleton',
  'SplashScreen',
  'Spinner',
  'Switch',
  'TextField',
  'Typography',
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
  '@vritti/quantum-ui-native': path.join(quantumUiNative, 'lib/index.tsx'),
};

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
export default (env) => {
  const { platform, mode } = env;
  const isNative = platform !== 'web';
  const rspack = require('@rspack/core');
  const devMfHost = mode === 'development'
    ? validateDevMfHost(process.env.DEV_MF_HOST)
    : (process.env.DEV_MF_HOST?.trim() ?? '');

  return {
    mode,
    context: __dirname,
    entry: './src/index.ts',

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
      ...(mode === 'development'
        ? { publicPath: `http://${devMfHost}:9002/[platform]/` }
        : {}),
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
        exposes: {
          './Items': './src/exposes/ItemsScreen.tsx',
          './Categories': './src/exposes/CategoriesScreen.tsx',
          './Modifiers': './src/exposes/ModifiersScreen.tsx',
          './StockAdjustments': './src/exposes/ItemsScreen.tsx',
        },
        shared: {
          react: { singleton: true, eager: false, import: false, requiredVersion: '19.2.3' },
          'react-native': { singleton: true, eager: false, import: false, requiredVersion: '0.83.2' },
          '@react-navigation/native': {
            singleton: true,
            eager: false,
            import: false,
            requiredVersion: '8.0.0-alpha.17',
          },
          '@react-navigation/elements': {
            singleton: true,
            eager: false,
            import: false,
            requiredVersion: '3.0.0-alpha.20',
          },
          '@react-navigation/bottom-tabs': {
            singleton: true,
            eager: false,
            import: false,
            requiredVersion: '8.0.0-alpha.22',
          },
          'react-native-safe-area-context': { singleton: true, eager: false, import: false, requiredVersion: '^5.7.0' },
          'react-native-screens': { singleton: true, eager: false, import: false, requiredVersion: '^4.24.0' },
          '@tanstack/react-query': { singleton: true, eager: false, import: false },
          axios: { singleton: true, eager: false, import: false },
          'react-native-reanimated': { singleton: true, eager: false, import: false },
          'react-native-worklets': { singleton: true, eager: false, import: false, requiredVersion: '0.8.1' },
          nativewind: { singleton: true, eager: false, import: false },
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
