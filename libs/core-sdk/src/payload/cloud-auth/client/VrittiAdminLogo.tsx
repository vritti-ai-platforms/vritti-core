import { PayloadLogo } from '@payloadcms/ui/graphics/Logo';
import { VrittiLogo } from './VrittiLogo.js';

/**
 * The logo on the admin login screen: Payload's mark, a multiplication sign, and ours — the usual way a
 * lockup says "built with" rather than "belongs to".
 *
 * Register it as `admin.components.graphics.Logo`, which `vrittiCloudAuth` does for you unless the site
 * sets its own. That slot is read by `@payloadcms/next`'s `elements/Logo`, which only the Login and Verify
 * views render — the small mark in the nav header is a separate slot (`graphics.Icon`) and is left as
 * Payload's, so the panel itself is unchanged.
 *
 * Sizing note: the two source files are not cropped alike. Payload's artwork fills its 43.5-unit viewBox
 * top to bottom; ours sits inside 65 units with padding above and below, so its ink covers only ~68% of
 * the box. Matching the `height` of both would render ours visibly smaller, so the heights below are
 * deliberately unequal to make the *ink* match.
 */

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
      {/* Decorative: the accessible names of the two logos either side already say who is who, and "times"
          read aloud between them adds nothing. */}
      <span className="vritti-brand-lockup__x" aria-hidden="true">
        &times;
      </span>
      <VrittiLogo />
    </div>
  );
}
