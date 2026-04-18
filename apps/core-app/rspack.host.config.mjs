import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../');
const quantumUiNative = path.resolve(__dirname, '../../..', 'quantum-ui-native');
const envFilePath = path.join(__dirname, '.env');

function loadCoreAppEnv() {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const envFile = fs.readFileSync(envFilePath, 'utf8');

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

function validateDeploymentsApiBaseUrl() {
  const rawValue = process.env.DEPLOYMENTS_API_BASE_URL?.trim();

  if (!rawValue) {
    throw new Error(
      `DEPLOYMENTS_API_BASE_URL is required. Set it in ${envFilePath} to the cloud server origin, for example https://local.vrittiai.com:3000`,
    );
  }

  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error(
      `DEPLOYMENTS_API_BASE_URL must be a valid absolute http/https URL. Received: ${rawValue}`,
    );
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(
      `DEPLOYMENTS_API_BASE_URL must use http or https. Received protocol: ${parsed.protocol}`,
    );
  }

  if (parsed.pathname && parsed.pathname !== '/') {
    throw new Error(
      `DEPLOYMENTS_API_BASE_URL must be an origin only and must not include a path like "${parsed.pathname}". Use something like https://local.vrittiai.com:3000`,
    );
  }

  if (parsed.search || parsed.hash) {
    throw new Error(
      'DEPLOYMENTS_API_BASE_URL must not include query params or a hash fragment.',
    );
  }

  return parsed.origin;
}

loadCoreAppEnv();
const deploymentsApiBaseUrl = validateDeploymentsApiBaseUrl();

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
  'FlashList',
  'Form',
  'Icon',
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
  'TextArea',
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
export default (env) => {
  const { platform, mode } = env;
  const isNative = platform !== 'web';
  const rspack = require('@rspack/core');

  return {
    mode,
    context: __dirname,
    entry: './src/host/index.tsx',

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
        '@module-federation/enhanced/runtime': require.resolve(
          '@module-federation/enhanced/runtime',
        ),
        '@module-federation/runtime-tools/runtime': require.resolve(
          '@module-federation/runtime-tools/runtime',
        ),
        '@module-federation/runtime': require.resolve(
          '@module-federation/runtime',
        ),
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
    },

    module: {
      rules: [
        // lucide-react-native: SWC directly (bypasses hermes parser issue with `const Infinity`)
        {
          test: /\.[cm]?[jt]sx?$/,
          include: [/node_modules[\\/]+lucide-react-native/],
          type: 'javascript/auto',
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'ecmascript', jsx: true },
                transform: { react: { runtime: 'automatic' } },
              },
            },
          },
        },

        // All other JS/TS: babel-swc-loader (RN 0.83 compatible)
        {
          test: /\.[cm]?[jt]sx?$/,
          exclude: [/node_modules[\\/]+lucide-react-native/],
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
        __DEPLOYMENTS_API_BASE_URL__: JSON.stringify(deploymentsApiBaseUrl),
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
          '@react-navigation/native': { singleton: true, eager: true, requiredVersion: '8.0.0-alpha.17' },
          '@react-navigation/elements': { singleton: true, eager: true, requiredVersion: '3.0.0-alpha.20' },
          '@react-navigation/bottom-tabs': { singleton: true, eager: true, requiredVersion: '8.0.0-alpha.22' },
          'react-native-safe-area-context': { singleton: true, eager: true, requiredVersion: '^5.7.0' },
          'react-native-screens': { singleton: true, eager: true, requiredVersion: '^4.24.0' },
          '@tanstack/react-query': { singleton: true, eager: true },
          axios: { singleton: true, eager: true },
          'react-native-reanimated': { singleton: true, eager: true },
          'react-native-worklets': { singleton: true, eager: true, requiredVersion: '0.8.1' },
          nativewind: { singleton: true, eager: true },
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
