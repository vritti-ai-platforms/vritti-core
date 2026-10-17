import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * graphql-codegen client-preset — generates typed `graphql()` documents (TypedDocumentNode) from
 * core-server's code-first schema, the same way commerce-ma does.
 *
 * The schema is the file NestJS regenerates on boot, committed to the repo, so `pnpm build` (which
 * runs codegen first) reproduces in CI and a document that has drifted from the schema fails the
 * build instead of shipping and failing inside a signup.
 *
 * `fragmentMasking` is off, matching commerce-ma — typed documents without the unmask ceremony.
 *
 * `emitLegacyCommonJSImports: false` makes the generated files import each other with `.js`
 * specifiers. This package is ESM, so an extensionless `./gql` does not resolve — and these files are
 * regenerated on every build, which means the extension has to come from here rather than from a fix
 * applied to the output.
 */
const config: CodegenConfig = {
  schema: '../../apps/core-server/src/schema.app.gql',
  documents: ['src/**/*.ts', '!src/core/gql/**'],
  ignoreNoDocuments: true,
  emitLegacyCommonJSImports: false,
  generates: {
    'src/core/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: { scalars: { DateTime: 'string' } },
    },
  },
};

export default config;
