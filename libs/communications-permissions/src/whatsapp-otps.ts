// WhatsApp OTP permission codes — MUST match the cloud catalog's authored codes exactly.
//
// Sub-resources mirror the route sub-paths, the same way ORG_PEOPLE does: `whatsapp-otps/stats`
// is gated by `stats.view`, `whatsapp-otps/configured-apps` by `configured-apps.view`. The parent
// `view` covers the feature's own table.
//
// `send` and `verify` are different in kind: they are granted to an APP credential's `graphql`
// bucket rather than to a person, and they are what let a storefront issue sign-in codes at all.
// A grant in the `web` bucket is inert — resolution reads only the bucket matching the credential.
//
// `send` spends money: every issued code is a billable WhatsApp message on the org's WABA.
export const ORG_WHATSAPP_OTPS = {
  featureCode: 'whatsapp-otps',
  view: 'org.whatsapp-otps.view',
  send: 'org.whatsapp-otps.send',
  verify: 'org.whatsapp-otps.verify',
  stats: {
    view: 'org.whatsapp-otps.stats.view',
  },
  configuredApps: {
    view: 'org.whatsapp-otps.configured-apps.view',
  },
} as const;
