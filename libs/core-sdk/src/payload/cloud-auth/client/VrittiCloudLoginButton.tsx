import { VrittiCloudLogo } from './VrittiCloudLogo.js';

/**
 * The "Continue with Vritti Cloud" button on the admin login screen.
 *
 * A plain anchor, deliberately: no hooks, no state, no `'use client'`. That keeps it a server component,
 * which in turn keeps this package free of a React runtime dependency — React is needed to *build* the
 * JSX, never to run it.
 *
 * It points at this site's own `/api/vritti-cloud/login`, which mints the PKCE state and redirects on to
 * cloud. Styled with Payload's own `btn` classes so it sits in the login form rather than beside it.
 *
 * The name is set in the lockup rather than in text, the way every other provider's button does it. The
 * SVG carries `aria-label="Vritti Cloud"`, so the accessible name is still the whole sentence — a screen
 * reader hears "Continue with Vritti Cloud", not "Continue with, image".
 */

const css = `
  .vritti-cloud-login {
    align-items: center;
    display: flex;
    gap: calc(var(--base) / 3);
    justify-content: center;
    width: 100%;
  }
  .vritti-cloud-login .vritti-cloud-logo {
    height: 16px;
    width: auto;
    /* The artwork carries its own leading; this pulls the baseline back onto the label's. */
    margin-top: 1px;
  }
`;

export function VrittiCloudLoginButton() {
  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <style>{css}</style>
      <a href="/api/vritti-cloud/login" className="btn btn--style-secondary btn--size-large vritti-cloud-login">
        Continue with
        <VrittiCloudLogo />
      </a>
    </div>
  );
}
