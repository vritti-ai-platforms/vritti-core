export const WHATSAPP_ACCOUNTS_KEY = ['communications', 'whatsapp-accounts'] as const;

export const WHATSAPP_ACCOUNTS_TABLE_KEY = [...WHATSAPP_ACCOUNTS_KEY, 'table'] as const;

export const WHATSAPP_ACCOUNT_KEY = (id: string) => [...WHATSAPP_ACCOUNTS_KEY, id] as const;

export const WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY = (accountId: string) =>
  [...WHATSAPP_ACCOUNT_KEY(accountId), 'phone-numbers'] as const;

export const WHATSAPP_PHONE_NUMBER_PROFILE_KEY = (accountId: string, phoneNumberId: string) =>
  [...WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(accountId), phoneNumberId, 'profile'] as const;

export const WHATSAPP_ACCOUNT_TEMPLATES_KEY = (accountId: string) =>
  [...WHATSAPP_ACCOUNT_KEY(accountId), 'templates'] as const;
