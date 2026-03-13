import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../');

/**
 * Rspack configuration enhanced with Re.Pack defaults for React Native.
 *
 * Learn about Rspack configuration: https://rspack.dev/config/
 * Learn about Re.Pack configuration: https://re-pack.dev/docs/guides/configuration
 */

const reactNativePackages =
  /node_modules[\\/](react-native|@react-native|@react-native-community)[\\/]/;

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: './index.ts',
  resolve: {
    ...Repack.getResolveOptions(),
  },
  resolveLoader: {
    modules: [path.resolve(workspaceRoot, 'node_modules'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        type: 'javascript/auto',
        include: reactNativePackages,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            presets: ['module:@react-native/babel-preset'],
          },
        },
      },
      {
        test: /\.[cm]?[jt]sx?$/,
        type: 'javascript/auto',
        exclude: reactNativePackages,
        use: {
          loader: 'builtin:swc-loader',
          options: Repack.getSwcLoaderOptions({
            syntax: 'typescript',
            jsx: true,
            jsxRuntime: 'automatic',
            externalHelpers: true,
          }),
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [new Repack.RepackPlugin()],
});
