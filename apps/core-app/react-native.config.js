const path = require('path');

module.exports = {
  commands: require('@callstack/repack/commands/rspack'),
  // Resolved through node rather than a hardcoded ./node_modules path: pnpm may hoist the package to
  // the workspace root or place it per-app (a link: override does the latter), and a fixed path breaks
  // the moment that changes — the font files silently vanish from the Xcode copy phase.
  assets: [
    path.join(path.dirname(require.resolve('@vritti/quantum-ui-native/package.json')), 'lib/assets/fonts'),
  ],
};