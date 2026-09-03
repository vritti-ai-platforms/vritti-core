import { VERSIONS } from './versions.js';

/**
 * What was answered, and everything that follows from it.
 *
 * The three features are independent questions; `sdk` is not asked, because
 * `vap` and `vrittiCloudAuth` both come from `@vritti/vap-sdk/payload` and
 * either one puts the package in the dependency list. Deriving it here rather
 * than in the canonical file is what keeps the config from having to express
 * "one or the other".
 */
export interface Answers {
  directory: string;
  projectName: string;
  workspaceId: string;
  siteCode: string;
  brand: string;
  media: boolean;
  cloudAuth: boolean;
  vap: boolean;
}

export interface Plan {
  answers: Answers;
  /** Region markers to keep. Everything else in `source/` is deleted on the way out. */
  regions: Set<string>;
  tokens: Record<string, string>;
  /** Files included only when a feature was taken — keyed by the region that owns them. */
  gatedFiles: Record<string, string>;
}

/**
 * Every site code lands in five places, and the sites that exist got this wrong.
 *
 * petstore-ecommerce declares `petstore` in `postgresAdapter`, in `vap()` and in
 * its own `.env.example`, while every migration it has hardcodes
 * `"venkys-pet-store"` — so a setup that follows the repo's own instructions
 * builds a schema the app never reads. It survives only because the deployment
 * injects the real value.
 *
 * Asking once and writing the answer everywhere, with no `|| 'fallback'` behind
 * it, is the single most useful thing this generator does.
 */
export function validateSiteCode(value: string): string | null {
  if (!value) return 'A site code is required — it names the database schema.';
  if (value.length > 63) return 'Postgres truncates identifiers at 63 characters.';
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return 'Lowercase letters, digits and hyphens, starting with a letter.';
  }
  return null;
}

/** Rejects a directory name npm would refuse as a package name. */
export function validateProjectName(value: string): string | null {
  if (!value) return 'A project name is required.';
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
    return 'Lowercase letters, digits, dots, hyphens and underscores; must not start with a symbol.';
  }
  return null;
}

/** Turns the answers into the regions, tokens and file gates the writer needs. */
export function buildPlan(answers: Answers): Plan {
  const regions = new Set<string>();
  if (answers.media) regions.add('feature:media');
  if (answers.cloudAuth) regions.add('feature:cloudAuth');
  if (answers.vap) regions.add('feature:vap');
  // Either plugin brings the SDK in, so the dependency and the email adapter it
  // provides are keyed off the pair rather than off `vap` alone.
  if (answers.vap || answers.cloudAuth) regions.add('feature:sdk');

  return {
    answers,
    regions,
    tokens: {
      __PROJECT_NAME__: answers.projectName,
      __SITE_CODE__: answers.siteCode,
      __BRAND__: answers.brand,
      __INFISICAL_WORKSPACE_ID__: answers.workspaceId,
      __PAYLOAD_VERSION__: VERSIONS.payload,
      __NEXT_VERSION__: VERSIONS.next,
      __REACT_VERSION__: VERSIONS.react,
      __SHARP_VERSION__: VERSIONS.sharp,
      __GRAPHQL_VERSION__: VERSIONS.graphql,
      __VAP_SDK_VERSION__: VERSIONS.vapSdk,
      __TYPESCRIPT_VERSION__: VERSIONS.typescript,
      __TYPES_NODE_VERSION__: VERSIONS.typesNode,
      __TYPES_REACT_VERSION__: VERSIONS.typesReact,
      __TYPES_REACT_DOM_VERSION__: VERSIONS.typesReactDom,
      __ESLINT_VERSION__: VERSIONS.eslint,
      __PNPM_VERSION__: VERSIONS.pnpm,
    },
    gatedFiles: {
      // Declining media means there is no `media` collection at all, not a
      // collection whose uploads fail. Local-disk storage is not an option on
      // this platform — it inflates the image and dies with the container — so
      // "no bucket" and "no uploads" are the same answer.
      'src/collections/Media.ts': 'feature:media',
      'src/lib/media.ts': 'feature:media',
    },
  };
}
