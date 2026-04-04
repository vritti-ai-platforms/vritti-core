import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Repack from '@callstack/repack';
import { ExpoModulesPlugin } from '@callstack/repack-plugin-expo-modules';
import { NativeWindPlugin } from '@callstack/repack-plugin-nativewind';

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

const quantumUiNative = path.resolve(__dirname, '../../..', 'quantum-ui-native');
const quantumUiNativeSrc = path.join(quantumUiNative, 'src');

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: './index.ts',
  resolve: {
    ...Repack.getResolveOptions(),
    symlinks: true,
    exportsFields: ['exports'],
    conditionNames: ['import', 'require', 'default'],
    alias: {
      '@': quantumUiNativeSrc,
    },
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
      path.resolve(quantumUiNative, 'node_modules'),
      'node_modules',
    ],
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
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, 'babel.config.js'),
          },
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [new Repack.RepackPlugin(), new ExpoModulesPlugin(), new NativeWindPlugin()],
});
