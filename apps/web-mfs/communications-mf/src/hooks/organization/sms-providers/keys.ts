export const SMS_PROVIDERS_KEY = ['communications', 'sms-providers'] as const;

export const SMS_PROVIDERS_TABLE_KEY = [...SMS_PROVIDERS_KEY, 'table'] as const;

export const SMS_PROVIDER_KEY = (id: string) => [...SMS_PROVIDERS_KEY, id] as const;
