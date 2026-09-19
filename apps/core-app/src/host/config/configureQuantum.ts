import { configureQuantumUI } from '@vritti/quantum-ui-native/config';
import quantumUINativeConfig from '../../../quantum-ui-native.config';

// Seeds quantum-ui-native's configuration as a side effect, and must be the FIRST import in
// bootstrap.ts so it runs before anything else in the graph is evaluated.
//
// getConfig() throws until the library is configured — deliberately, so a wrong endpoint fails loudly
// rather than silently. But several modules read configuration at module-evaluation time (the library's
// own `export const axios = createAxiosInstance()`, and this app's apolloClient), and ES imports are
// hoisted: by the time bootstrap.ts's body runs its configureQuantumUINative() call, that whole graph
// has already been evaluated and thrown. Seeding here — from a module that imports only `config`, which
// itself imports nothing — is what makes those eager reads legal.
//
// bootstrap.ts still calls configureQuantumUINative(): this sets only the config object, while that
// call additionally registers the Keychain storage adapter and pushes the values onto axios defaults.
configureQuantumUI(quantumUINativeConfig);
