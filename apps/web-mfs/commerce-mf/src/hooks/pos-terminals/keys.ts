export const POS_TERMINALS_KEY = ['commerce', 'pos-terminals'] as const;
export const POS_TERMINALS_TABLE_KEY = [...POS_TERMINALS_KEY, 'table'] as const;
export const POS_TERMINAL_KEY = [...POS_TERMINALS_KEY, 'detail'] as const;
