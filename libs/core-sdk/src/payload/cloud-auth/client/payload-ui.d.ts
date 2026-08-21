/**
 * Payload's own logo component, declared rather than depended on.
 *
 * `@payloadcms/ui` is present in every Payload app by definition — it is what renders the admin panel —
 * so the consumer's bundler resolves this import at build time. Declaring the one symbol we use keeps a
 * very large package out of this SDK's own dependency tree, the same way the rest of the plugin types
 * payload structurally instead of importing it.
 */
declare module '@payloadcms/ui/graphics/Logo' {
  export const PayloadLogo: () => import('react').ReactElement;
}
