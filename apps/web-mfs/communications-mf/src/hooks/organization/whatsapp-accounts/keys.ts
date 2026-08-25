export const WHATSAPP_ACCOUNTS_KEY = ['communications', 'whatsapp-accounts'] as const;

export const WHATSAPP_ACCOUNTS_TABLE_KEY = [...WHATSAPP_ACCOUNTS_KEY, 'table'] as const;

export const WHATSAPP_ACCOUNT_KEY = (id: string) => [...WHATSAPP_ACCOUNTS_KEY, id] as const;
