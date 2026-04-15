import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as Repack from '@callstack/repack';
import { ReanimatedPlugin } from '@callstack/repack-plugin-reanimated';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../..');
const quantumUiNative = path.resolve(__dirname, '../../../..', 'quantum-ui-native');

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
  'Alert', 'Avatar', 'Badge', 'BottomNavigation', 'Button', 'Card',
  'Checkbox', 'FlashList', 'Form', 'Icon', 'Input', 'Label',
  'NativeStack', 'Progress', 'RadioGroup', 'Separator', 'Skeleton',
  'Spinner', 'Switch', 'TextArea', 'TextField', 'Typography',
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
    },

    module: {
      rules: [
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
        output: { bundleFilename: 'index.bundle' },
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
        },
        shared: {
          react: { singleton: true, eager: false, requiredVersion: '19.2.3' },
          'react-native': { singleton: true, eager: false, requiredVersion: '0.83.2' },
          '@react-navigation/native': { singleton: true, eager: false, requiredVersion: '^7.2.2' },
          '@react-navigation/native-stack': { singleton: true, eager: false, requiredVersion: '^7.14.10' },
          '@react-navigation/bottom-tabs': { singleton: true, eager: false, requiredVersion: '^7.0.0' },
          'react-native-safe-area-context': { singleton: true, eager: false, requiredVersion: '^5.7.0' },
          'react-native-screens': { singleton: true, eager: false, requiredVersion: '^4.24.0' },
          '@tanstack/react-query': { singleton: true, eager: false },
          axios: { singleton: true, eager: false },
          'react-native-reanimated': { singleton: true, eager: false },
          'react-native-worklets': { singleton: true, eager: false },
          nativewind: { singleton: true, eager: false },
        },
      }),

      ...(isNative
        ? [
            new rspack.NormalModuleReplacementPlugin(
              /^react-native-css\/components\/.+$/,
              (resource) => {
                resource.request = rnCssComponentsPath;
              },
            ),
            new rspack.NormalModuleReplacementPlugin(
              /^react-native-css\/react-native$/,
              (resource) => {
                resource.request = rnCssComponentsPath;
              },
            ),
            new rspack.NormalModuleReplacementPlugin(
              /react-native-css-metro-override/,
              require.resolve('./noop.js'),
            ),
          ]
        : []),
    ],
  };
};
