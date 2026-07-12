export const CREDIT_NOTES_KEY = ['commerce', 'credit-notes'] as const;
export const CREDIT_NOTES_TABLE_KEY = [...CREDIT_NOTES_KEY, 'table'] as const;
export const CREDIT_NOTE_KEY = (id: string) => [...CREDIT_NOTES_KEY, id] as const;
