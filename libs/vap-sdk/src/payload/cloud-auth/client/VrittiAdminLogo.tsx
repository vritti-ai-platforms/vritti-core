import { PayloadLogo } from '@payloadcms/ui/graphics/Logo';
import { VrittiLogo } from './VrittiLogo.js';

const css = `
  .vritti-brand-lockup {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: clamp(10px, 3vw, 18px);
    width: 100%;
  }
  .vritti-brand-lockup .graphic-logo {
    height: 26px;
    width: auto;
    max-width: 100%;
  }
  .vritti-brand-lockup .vritti-logo {
    height: 38px;
    width: auto;
    max-width: 100%;
  }
  /* Payload's own elevation token, so the glyph tracks the admin theme without us hardcoding a grey that
     only works on one ground. */
  .vritti-brand-lockup__x {
    color: var(--theme-elevation-400);
    font-size: 18px;
    line-height: 1;
    user-select: none;
  }
`;

export function VrittiAdminLogo() {
  return (
    <div className="vritti-brand-lockup">
      <style>{css}</style>
      <PayloadLogo />
      {/* Decorative: the accessible names of the two logos either side already say who is who, and "times" read aloud between them adds nothing. */}
      <span className="vritti-brand-lockup__x" aria-hidden="true">
        &times;
      </span>
      <VrittiLogo />
    </div>
  );
}
