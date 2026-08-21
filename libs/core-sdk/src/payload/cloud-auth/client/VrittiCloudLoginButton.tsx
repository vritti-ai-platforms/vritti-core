import { VrittiCloudLogo } from './VrittiCloudLogo.js';

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
