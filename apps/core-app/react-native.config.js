const path = require('path');

module.exports = {
  commands: require('@callstack/repack/commands/rspack'),
  assets: [path.resolve(__dirname, 'node_modules/@vritti/quantum-ui-native/lib/assets/fonts')],
};