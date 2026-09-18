export const SMS_PROVIDER_TEMPLATES_KEY = (providerId: string) =>
  ['communications', 'sms-providers', providerId, 'templates'] as const;
