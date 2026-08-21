/**
 * The admin-panel components this package contributes, resolved through the consuming app's generated
 * import map — so a site runs `payload generate:importmap` after adding or moving one.
 *
 * Everything here is a server component: no hooks, no state, no `'use client'`. React is needed to build
 * the JSX, never to run it, which is what keeps this package free of a React runtime dependency.
 */

export { VrittiAdminLogo } from './VrittiAdminLogo.js';
export { VrittiCloudLoginButton } from './VrittiCloudLoginButton.js';
export { VrittiCloudLogo } from './VrittiCloudLogo.js';
export { VrittiLogo } from './VrittiLogo.js';

export { VrittiCloudLoginButton as default } from './VrittiCloudLoginButton.js';
