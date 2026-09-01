// SMS OTP permission codes — MUST match the cloud catalog's authored codes exactly.
//
// Mirrors ORG_WHATSAPP_OTPS: `send` and `verify` are granted to an APP credential's `graphql`
// bucket rather than to a person — they are what let a storefront issue sign-in codes over SMS.
// A grant in the `web` bucket is inert for them.
//
// `send` spends money on every provider except the dev-only console transport.
export const ORG_SMS_OTPS = {
  featureCode: 'sms-otps',
  view: 'org.sms-otps.view',
  send: 'org.sms-otps.send',
  verify: 'org.sms-otps.verify',
  stats: {
    view: 'org.sms-otps.stats.view',
  },
  configuredApps: {
    view: 'org.sms-otps.configured-apps.view',
  },
} as const;
