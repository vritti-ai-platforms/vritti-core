const path = require('path');
const Repack = require('@callstack/repack');

/** @type {(env: import('@callstack/repack').EnvOptions) => import('@rspack/core').Configuration} */
module.exports = (env) => {
  const {
    mode = 'development',
    context = __dirname,
    entry = './index.js',
    platform,
    minimize = mode === 'production',
    devServer = undefined,
    bundleFilename = undefined,
    sourceMapFilename = undefined,
    assetsDir = undefined,
  } = env;

  return {
    mode,
    devtool: false,
    context,
    entry: { main: entry },
    resolve: {
      ...Repack.getResolveOptions(platform),
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    output: {
      clean: true,
      hashFunction: 'xxhash64',
      path: path.join(__dirname, 'build/generated', platform),
      filename: 'index.bundle',
      chunkFilename: '[name].chunk.bundle',

    },
    optimization: {
      minimize,
      chunkIds: 'named',
    },
    module: {
      rules: [
        ...Repack.getJsTransformRules(),
        ...Repack.getFlowTransformRules(),
        ...Repack.getAssetTransformRules(),
      ],
    },
    plugins: [
      new Repack.RepackPlugin({
        context,
        mode,
        platform,
        devServer,
        output: { bundleFilename, sourceMapFilename, assetsDir },
      }),
      new Repack.plugins.ModuleFederationPlugin({
        name: 'vritti_core_app',
        filename: 'container.js.bundle',
        exposes: {},
        remotes: {},
        shared: {
          react: {
            singleton: true,
            eager: true,
            requiredVersion: '^19.2.0',
          },
          'react-native': {
            singleton: true,
            eager: true,
            requiredVersion: '^0.83.0',
          },
          axios: {
            singleton: true,
            eager: true,
            requiredVersion: '^1.0.0',
          },
          '@tanstack/react-query': {
            singleton: true,
            eager: true,
            requiredVersion: '^5.0.0',
          },
        },
      }),
    ],
  };
};
