/**
 * The "Continue with Vritti Cloud" button on the admin login screen.
 *
 * A plain anchor, deliberately: no hooks, no state, no `'use client'`. That keeps it a server component,
 * which in turn keeps this package free of a React runtime dependency — React is needed to *build* the
 * JSX, never to run it.
 *
 * It points at this site's own `/api/vritti-cloud/login`, which mints the PKCE state and redirects on to
 * cloud. Styled with Payload's own `btn` classes so it sits in the login form rather than beside it.
 */
export function VrittiCloudLoginButton() {
  return (
    <div style={{ marginBottom: 'var(--base)' }}>
      <a
        href="/api/vritti-cloud/login"
        className="btn btn--style-secondary btn--size-large"
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 'calc(var(--base) / 2)',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <VrittiMark />
        Continue with Vritti Cloud
      </a>
    </div>
  );
}

/**
 * The Vritti mark, inlined rather than linked.
 *
 * Taken from cloud-web's `vritti_cloud_light.svg` — the glyph only, cropped away from the wordmark beside
 * it, since the button already says the name. Inline because this component is rendered inside a
 * consumer's admin panel: there is no asset pipeline of ours to serve a file through, and a remote URL
 * would put the login screen at the mercy of another origin being up.
 *
 * The gradient ids are namespaced: this renders inside somebody else's page, where a bare `paint0_linear`
 * would collide with whatever else is on it.
 */
function VrittiMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="18"
      viewBox="0 14 40 38"
      width="19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Vritti</title>
      <path
        d="M7.99999 14H1.30874C0.614275 14.0193 0 14 0 14L18.8085 51.5C19.7652 52.3585 19.9594 52.3219 19.8087 51.5C19.3792 51.0014 19.4775 50.4593 20.3087 49C21.1421 46.2568 21.2304 43.8491 19.3087 41.5C18.2179 39.4696 18.9309 37.1826 20.8087 34L16.8087 26.5L14.8087 22.5L12.3087 18L11 15C10.5113 14.44 10.1886 14.2085 9.5 14H8.49999H7.99999Z"
        fill="url(#vritti-mark-stroke)"
      />
      <path
        d="M35.0507 14C37.2595 14.0004 39.0507 15.7911 39.0507 18C39.0507 20.2089 37.2595 21.9996 35.0507 22C34.4331 21.9999 33.8472 21.8594 33.3251 21.6094C33.1714 21.6936 33.0228 21.829 32.8553 22.0293L24.3583 35.0234C24.2882 35.1904 24.2274 35.3388 24.1805 35.4658C24.1331 35.5943 24.1019 35.6986 24.0927 35.7783C24.0834 35.8587 24.099 35.9018 24.1229 35.9238C24.1488 35.9469 24.2031 35.9626 24.3085 35.9502C26.1439 35.5539 27.4169 35.1177 28.4637 34.5029C29.5109 33.8878 30.3371 33.0905 31.2772 31.9678L33.3827 28.5957C33.1697 28.1068 33.0507 27.5673 33.0507 27C33.0507 24.791 34.8417 23.0002 37.0507 23C39.2597 23.0002 41.0507 24.791 41.0507 27C41.0507 29.0504 39.5075 30.7394 37.5194 30.9717C37.459 30.9962 37.397 31.0224 37.3339 31.0469L37.3173 31.0527L37.3007 31.0479C37.2448 31.0305 37.1894 31.0136 37.1356 30.9971C37.1076 30.9977 37.0789 31 37.0507 31C36.4652 30.9999 35.9092 30.8725 35.4081 30.6465C35.0278 30.6575 34.6938 30.7719 34.3505 31.0352L21.3573 51.5264L21.3534 51.5342L21.3466 51.5391C21.2336 51.6277 21.1425 51.6842 21.0507 51.6836C20.9809 51.6826 20.9167 51.6494 20.8505 51.5967L20.7821 51.5371C20.6425 51.4109 20.5854 51.2341 20.5887 51.0195C20.5921 50.8061 20.6543 50.5492 20.7577 50.2539C20.9644 49.664 21.3412 48.8997 21.7675 47.9834C22.0915 46.9083 22.1753 46.1149 22.0751 45.3691C21.9746 44.6219 21.6897 43.9177 21.2704 43.0215V43.0205C20.4116 41.1274 20.0867 40.2768 20.0155 39.6953C19.9796 39.4019 20.0079 39.1768 20.0624 38.9248C20.117 38.6719 20.1966 38.3975 20.2665 37.9912L20.2675 37.9824L20.2723 37.9736L31.2723 19.9736H31.2733C31.3431 19.8632 31.3907 19.7685 31.4198 19.6807C31.1829 19.1697 31.0507 18.6002 31.0507 18C31.0507 15.7911 32.8418 14.0004 35.0507 14ZM36.9999 25C35.8954 25.0001 34.9999 25.8955 34.9999 27C34.9999 28.1045 35.8954 28.9999 36.9999 29C38.1043 28.9999 38.9999 28.1045 38.9999 27C38.9999 25.8955 38.1043 25.0001 36.9999 25ZM34.9999 16C33.8953 16 32.9999 16.8954 32.9999 18C32.9999 19.1046 33.8953 20 34.9999 20C36.1044 19.9999 36.9999 19.1045 36.9999 18C36.9999 16.8955 36.1044 16.0001 34.9999 16Z"
        fill="url(#vritti-mark-swoosh)"
      />
      <defs>
        <linearGradient gradientUnits="userSpaceOnUse" id="vritti-mark-stroke" x1="19.5" x2="0.999996" y1="52" y2="16">
          <stop stopColor="#0959B9" />
          <stop offset="1" stopColor="#1B74D1" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="vritti-mark-swoosh"
          x1="30.5245"
          x2="30.5245"
          y1="14"
          y2="51.6836"
        >
          <stop stopColor="#9E9E9E" />
          <stop offset="1" stopColor="#464646" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default VrittiCloudLoginButton;
