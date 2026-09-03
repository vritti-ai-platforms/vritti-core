/**
 * The one tested set of versions a scaffolded site is pinned to.
 *
 * **Never `latest`.** An unpinned dependency is how a generator ships a site
 * that built yesterday and does not build today, and it is the specific mistake
 * that made create-react-app unmaintainable. Bumping any line here is a commit
 * whose CI run scaffolds every feature combination and builds it; if that
 * passes the bump is real, and if it does not the bump never lands.
 *
 * The two sibling sites drifted to 3.86.0/16.2.6 and 3.88.0/16.3.3 on their own,
 * which is the drift this file exists to stop.
 */
export const VERSIONS = {
  payload: '3.88.0',
  next: '16.3.3',
  react: '19.2.6',
  sharp: '0.34.2',
  graphql: '^16.8.1',
  vapSdk: '0.0.3',
  typescript: '5.7.3',
  typesNode: '22.19.9',
  typesReact: '19.2.14',
  typesReactDom: '19.2.3',
  eslint: '^9.16.0',
  pnpm: '11.21.0',
} as const;
